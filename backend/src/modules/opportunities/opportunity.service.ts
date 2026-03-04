import { prisma } from '../../core/prisma.js';
import { Prisma } from '@prisma/client';

export class OpportunityService {

    async getAllOpportunities(page: number = 1, limit: number = 10, search: string = '') {
        const offset = (page - 1) * limit;

        const whereClause: Prisma.OpportunityWhereInput = search ? {
            OR: [
                { product: { contains: search, mode: 'insensitive' as const } },
                {
                    client: {
                        OR: [
                            { name: { contains: search, mode: 'insensitive' as const } },
                            { company: { contains: search, mode: 'insensitive' as const } }
                        ]
                    }
                }
            ]
        } : {};

        const [opportunities, total] = await Promise.all([
            prisma.opportunity.findMany({
                where: whereClause,
                include: {
                    client: {
                        select: { name: true, company: true }
                    }
                },
                orderBy: { created_at: 'desc' },
                skip: offset,
                take: limit
            }),
            prisma.opportunity.count({ where: whereClause })
        ]);

        const mappedData = opportunities.map(opp => ({
            ...opp,
            client_name: opp.client?.name || 'Cliente Desconocido',
            client_company: opp.client?.company || 'Empresa Desconocida'
        }));

        return {
            data: mappedData,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async createOpportunity(data: { client_id: number; product: string; amount: number; status?: string; estimated_close_date?: string }, tenantId: number) {
        return await prisma.opportunity.create({
            data: {
                client_id: data.client_id,
                tenant_id: tenantId,
                product: data.product,
                amount: data.amount,
                status: data.status || 'pendiente',
                estimated_close_date: data.estimated_close_date ? new Date(data.estimated_close_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });
    }

    async updateOpportunityStatusById(id: number, status: string, version?: number) {
        // Implement optimistic locking if version is provided, otherwise just update
        if (version !== undefined) {
            return await prisma.opportunity.update({
                where: {
                    id,
                    version
                },
                data: {
                    status,
                    version: { increment: 1 }
                }
            });
        } else {
            return await prisma.opportunity.update({
                where: { id },
                data: { status }
            });
        }
    }
}

export const opportunityService = new OpportunityService();
