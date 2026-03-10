import { prisma } from '../core/prisma.js';
import { Opportunity, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository.js';

export class OpportunityRepository extends BaseRepository<Opportunity> {
    constructor() {
        super(prisma.opportunity, 'Opportunity');
    }

    async findManyPaged(tenantId: number, options: { cursor?: number; limit?: number; search?: string }) {
        const { cursor, limit = 10, search = '' } = options;

        const where: Prisma.OpportunityWhereInput = {
            tenant_id: tenantId,
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

    async countSearch(tenantId: number, search = '') {
        const where: Prisma.OpportunityWhereInput = {
            tenant_id: tenantId,
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
