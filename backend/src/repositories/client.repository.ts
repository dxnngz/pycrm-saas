import { prisma } from '../core/prisma.js';
import { Client, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository.js';

export class ClientRepository extends BaseRepository<Client> {
    constructor() {
        super(prisma.client, 'Client');
    }

    async findManyPaged(tenantId: number, options: { cursor?: number; limit?: number; search?: string }) {
        const { cursor, limit = 10, search = '' } = options;

        const where: Prisma.ClientWhereInput = {
            tenant_id: tenantId,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { company: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            })
        };

        return await this.findMany(tenantId, {
            where,
            take: limit + 1,
            cursor,
            orderBy: { id: 'asc' }
        });
    }

    async countSearch(tenantId: number, search = '') {
        const where: Prisma.ClientWhereInput = {
            tenant_id: tenantId,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { company: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            })
        };
        return await this.count(tenantId, { where });
    }

    async findOpportunities(tenantId: number, clientId: number) {
        return await prisma.opportunity.findMany({
            where: { client_id: clientId, tenant_id: tenantId },
            orderBy: { created_at: 'desc' }
        });
    }
}

export const clientRepository = new ClientRepository();
