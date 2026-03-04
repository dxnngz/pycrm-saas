import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';

jest.mock('@redis/client', () => {
    const mClient = {
        connect: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        on: jest.fn<() => void>(),
        quit: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        get: jest.fn<() => Promise<string | null>>().mockResolvedValue(null),
        set: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        setEx: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        del: jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
    };
    return {
        createClient: jest.fn(() => mClient)
    };
});

import { PrismaClient } from '@prisma/client';
import { prisma } from '../src/core/prisma.js';
import { contextStore } from '../src/core/context.js';

const basePrisma = new PrismaClient();

describe('Multi-Tenant Sandbox Isolation Tests', () => {
    let tenantA: any;
    let tenantB: any;
    let userA: any;
    let userB: any;
    let clientA: any;
    let clientB: any;

    beforeAll(async () => {
        // Setup raw base data using the raw PrismaClient to bypass isolation during setup
        tenantA = await basePrisma.tenant.create({ data: { name: 'Empresa A' } });
        tenantB = await basePrisma.tenant.create({ data: { name: 'Empresa B' } });

        userA = await basePrisma.user.create({
            data: { tenant_id: tenantA.id, name: 'User A', email: `a${Date.now()}@test.com`, password: '123' }
        });
        userB = await basePrisma.user.create({
            data: { tenant_id: tenantB.id, name: 'User B', email: `b${Date.now()}@test.com`, password: '123' }
        });

        clientA = await basePrisma.client.create({
            data: { tenant_id: tenantA.id, name: 'Client A' }
        });
        clientB = await basePrisma.client.create({
            data: { tenant_id: tenantB.id, name: 'Client B' }
        });
    });

    afterAll(async () => {
        await basePrisma.tenant.deleteMany({
            where: { id: { in: [tenantA.id, tenantB.id] } }
        });
        await basePrisma.$disconnect();
    });

    it('User A CANNOT read User B`s Client through findUnique', async () => {
        // Execute inside Context A
        const result = await contextStore.run({ userId: userA.id, tenantId: tenantA.id, isSystem: false }, async () => {
            // Prisma will override finding Client B because it forces `tenant_id = A`
            try {
                // El interceptor convierte findUnique en findFirst, lo que retornará null
                const c = await prisma.client.findUnique({
                    where: { id: clientB.id }
                });
                return c;
            } catch (err) {
                return null;
            }
        });

        expect(result).toBeNull();
    });

    it('User A CANNOT read User B`s Client through findMany', async () => {
        const result = await contextStore.run({ userId: userA.id, tenantId: tenantA.id, isSystem: false }, async () => {
            return await prisma.client.findMany();
        });

        const ids = result.map(c => c.id);
        expect(ids).toContain(clientA.id);
        expect(ids).not.toContain(clientB.id);
    });

    it('User B CANNOT mutate User A`s Client through update', async () => {
        const result = await contextStore.run({ userId: userB.id, tenantId: tenantB.id, isSystem: false }, async () => {
            try {
                await prisma.client.update({
                    where: { id: clientA.id },
                    data: { name: 'Hacked by B' }
                });
                return 'success'; // Should not reach here
            } catch (error: any) {
                return error.code; // Expected P2025: Record not found
            }
        });

        // Prisma arroja P2025 cuando un update con where the falla
        expect(result).toBe('P2025');
    });

    it('Opportunity nested read respects Sandbox', async () => {
        // Setup crossed Opportunity under Base System (Bypassed)
        const opp = await basePrisma.opportunity.create({
            data: {
                tenant_id: tenantA.id,
                client_id: clientA.id,
                product: 'Cross Prod',
                amount: 1000
            }
        });

        const result = await contextStore.run({ userId: userB.id, tenantId: tenantB.id, isSystem: false }, async () => {
            const opps = await prisma.opportunity.findMany({
                include: { client: true }
            });
            return opps.find(o => o.id === opp.id);
        });

        expect(result).toBeUndefined();
    });

    // -------------------------------------------------------------
    // Additional Test Cases for Priority Action Plan
    // -------------------------------------------------------------

    it('findFirst ONLY returns records for the Current Tenant', async () => {
        // Create an Event in Tenant B
        const eventB = await basePrisma.event.create({
            data: {
                tenant_id: tenantB.id,
                title: 'Secret Board Meeting',
                start_date: new Date(),
                end_date: new Date()
            }
        });

        // User A tries to find an Event with this title
        const result = await contextStore.run({ userId: userA.id, tenantId: tenantA.id, isSystem: false }, async () => {
            return await prisma.event.findFirst({
                where: { title: 'Secret Board Meeting' }
            });
        });

        // Prisma Interceptor adds `tenant_id = tenantA.id` so it won't find Tenant B's event.
        expect(result).toBeNull();
    });

    it('aggregate ONLY calculates values for the Current Tenant', async () => {
        // Create Opportunities for Tenant A and B
        await basePrisma.opportunity.createMany({
            data: [
                { tenant_id: tenantA.id, product: 'A1', amount: 500 },
                { tenant_id: tenantA.id, product: 'A2', amount: 500 },
                { tenant_id: tenantB.id, product: 'B1', amount: 10000 },
            ]
        });

        const result = await contextStore.run({ userId: userA.id, tenantId: tenantA.id, isSystem: false }, async () => {
            return await prisma.opportunity.aggregate({
                _sum: { amount: true }
            });
        });

        // Only the $1000 from Tenant A should be summed
        // Ignore the existing $1000 'Cross Prod' created in setup unless filtering exactly
        const expectedBaseAmount = Number(result._sum.amount);
        expect(expectedBaseAmount).toBeLessThan(10000);
    });

    it('groupBy strictly segregates by tenant_id automatically', async () => {
        // create Tasks in both tenants
        // We add 1 'High' task to Tenant A and 2 'High' tasks to Tenant B.
        // If groupBy leaks, User A's result would show 3 'High' tasks.
        await basePrisma.task.createMany({
            data: [
                { tenant_id: tenantA.id, title: 'T1', priority: 'High' },
                { tenant_id: tenantB.id, title: 'T2', priority: 'High' },
                { tenant_id: tenantB.id, title: 'T3', priority: 'High' }
            ]
        });

        const result = await contextStore.run({ userId: userA.id, tenantId: tenantA.id, isSystem: false }, async () => {
            return await prisma.task.groupBy({
                by: ['priority'],
                _count: { priority: true }
            });
        });

        // We ensure we don't accidentally count Tenant B's High priority tasks
        const highPriorityTasksA = result.find(r => r.priority === 'High');
        expect(highPriorityTasksA?._count.priority).toBe(1); // Because Tenant A only has 1

        // Ensure User B gets their isolated view (2 tasks)
        const resultB = await contextStore.run({ userId: userB.id, tenantId: tenantB.id, isSystem: false }, async () => {
            return await prisma.task.groupBy({
                by: ['priority'],
                _count: { priority: true }
            });
        });
        const highPriorityTasksB = resultB.find(r => r.priority === 'High');
        expect(highPriorityTasksB?._count.priority).toBe(2);
    });

    it('$transaction respects the context tenant_id', async () => {
        const result = await contextStore.run({ userId: userA.id, tenantId: tenantA.id, isSystem: false }, async () => {
            return await prisma.$transaction(async (tx) => {
                // Try to get a client from Tenant B inside a transaction
                try {
                    const c = await tx.client.findUnique({
                        where: { id: clientB.id }
                    });
                    return c;
                } catch (err) {
                    return null;
                }
            });
        });

        expect(result).toBeNull();
    });

    it('Document nested queries respect Sandbox', async () => {
        const docB = await basePrisma.document.create({
            data: {
                tenant_id: tenantB.id,
                client_id: clientB.id,
                name: 'Confidential B.pdf',
                type: 'PDF'
            }
        });

        const result = await contextStore.run({ userId: userA.id, tenantId: tenantA.id, isSystem: false }, async () => {
            // Attempt to fetch ALL clients and include their documents. 
            // The user A should only see their clients and their documents.
            const clients = await prisma.client.findMany({
                include: { documents: true }
            });
            return clients;
        });

        // User A's result must NOT contain Client B or Document B
        const clientIds = result.map(c => c.id);
        expect(clientIds).not.toContain(clientB.id);

        const allDocs = result.flatMap(c => c.documents).map(d => d.id);
        expect(allDocs).not.toContain(docB.id);
    });
});
