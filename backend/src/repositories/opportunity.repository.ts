import { prisma } from '../core/prisma.js';
import { Opportunity, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository.js';

export class OpportunityRepository extends BaseRepository<Opportunity> {
    constructor() {
        super(prisma.opportunity, 'Opportunity');
    }

    async findManyPaged(
        tenantId: number,
        options: {
            cursor?: number;
            limit?: number;
            search?: string;
            status?: string;
            assigned_to?: number;
            amount_min?: number;
            amount_max?: number;
            overdue?: boolean;
        }
    ) {
        const { cursor, limit = 10, search = '', status, assigned_to, amount_min, amount_max, overdue } = options;

        const where: Prisma.OpportunityWhereInput = {
            tenant_id: tenantId,
            ...(status && { status }),
            ...(typeof assigned_to === 'number' && Number.isFinite(assigned_to) && { assigned_to }),
            ...((typeof amount_min === 'number' || typeof amount_max === 'number') && {
                amount: {
                    ...(typeof amount_min === 'number' && Number.isFinite(amount_min) && { gte: amount_min }),
                    ...(typeof amount_max === 'number' && Number.isFinite(amount_max) && { lte: amount_max }),
                }
            }),
            ...(overdue && {
                next_action_at: {
                    not: null,
                    lt: new Date()
                }
            }),
            ...(search && {
                OR: [
                    { product: { contains: search, mode: 'insensitive' } },
                    { client: { name: { contains: search, mode: 'insensitive' } } },
                    { client: { company: { contains: search, mode: 'insensitive' } } }
                ]
            })
        };

        return await this.findMany(tenantId, {
            where,
            take: limit + 1,
            cursor,
            orderBy: { id: 'asc' },
            include: {
                client: {
                    select: { name: true, company: true }
                }
            }
        });
    }

    async countFiltered(
        tenantId: number,
        options: {
            search?: string;
            status?: string;
            assigned_to?: number;
            amount_min?: number;
            amount_max?: number;
            overdue?: boolean;
        } = {}
    ) {
        const { search = '', status, assigned_to, amount_min, amount_max, overdue } = options;
        const where: Prisma.OpportunityWhereInput = {
            tenant_id: tenantId,
            ...(status && { status }),
            ...(typeof assigned_to === 'number' && Number.isFinite(assigned_to) && { assigned_to }),
            ...((typeof amount_min === 'number' || typeof amount_max === 'number') && {
                amount: {
                    ...(typeof amount_min === 'number' && Number.isFinite(amount_min) && { gte: amount_min }),
                    ...(typeof amount_max === 'number' && Number.isFinite(amount_max) && { lte: amount_max }),
                }
            }),
            ...(overdue && {
                next_action_at: {
                    not: null,
                    lt: new Date()
                }
            }),
            ...(search && {
                OR: [
                    { product: { contains: search, mode: 'insensitive' } },
                    { client: { name: { contains: search, mode: 'insensitive' } } },
                    { client: { company: { contains: search, mode: 'insensitive' } } }
                ]
            })
        };
        return await this.count(tenantId, { where });
    }
}

export const opportunityRepository = new OpportunityRepository();
