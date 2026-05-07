import { prisma } from '../../core/prisma.js';
import { redisCache } from '../../core/redis.js';
import { opportunityRepository } from '../../repositories/opportunity.repository.js';

export class OpportunityService {

    async getAllOpportunities(tenantId: number, options: { limit?: number; search?: string; cursor?: number } = {}) {
        const { limit = 10, search = '', cursor } = options;
        const cacheKey = `cache:opportunities:${tenantId}:l${limit}:s${search}:c${cursor || 0}`;

        return await redisCache.getOrSet(cacheKey, 300, async () => {
            const [opportunities, total] = await Promise.all([
                opportunityRepository.findManyPaged(tenantId, { cursor, limit, search }),
                opportunityRepository.countSearch(tenantId, search)
            ]);

            const hasMore = opportunities.length > limit;
            const items = hasMore ? opportunities.slice(0, limit) : opportunities;

            const mappedData = items.map((opp: any) => ({
                ...opp,
                client_name: (opp as any).client?.name || 'Cliente Desconocido',
                client_company: (opp as any).client?.company || 'Empresa Desconocida'
            }));

            const lastItem = items[items.length - 1];
            const nextCursor = hasMore ? lastItem?.id : null;

            return {
                data: mappedData,
                total,
                limit,
                nextCursor,
                hasMore
            };
        });
    }

    async getOpportunitySummary(tenantId: number, options: { search?: string } = {}) {
        const search = (options.search || '').trim();
        const q = `%${search}%`;

        const rows: Array<{ status_norm: string; count: number; amount: any }> = await prisma.$queryRaw`
            SELECT 
                CASE
                    WHEN o.status = 'ganada' THEN 'ganado'
                    WHEN o.status = 'perdida' THEN 'perdido'
                    WHEN o.status = 'negociacion' THEN 'pendiente'
                    ELSE COALESCE(o.status, 'pendiente')
                END as status_norm,
                COUNT(*)::int as count,
                COALESCE(SUM(o.amount), 0) as amount
            FROM opportunities o
            LEFT JOIN clients c ON c.id = o.client_id AND c.tenant_id = ${tenantId} AND c.deleted_at IS NULL
            WHERE o.tenant_id = ${tenantId}
              AND o.deleted_at IS NULL
              AND (
                ${search} = ''
                OR o.product ILIKE ${q}
                OR c.name ILIKE ${q}
                OR c.company ILIKE ${q}
              )
            GROUP BY status_norm
        `;

        const byStatus = {
            pendiente: 0,
            ganado: 0,
            perdido: 0
        };

        const amountByStatus = {
            pendiente: 0,
            ganado: 0,
            perdido: 0
        };

        let total = 0;
        for (const r of rows || []) {
            const key = String((r as any).status_norm || '').trim();
            if (key !== 'pendiente' && key !== 'ganado' && key !== 'perdido') continue;
            const count = Number((r as any).count) || 0;
            const amount = Number((r as any).amount) || 0;
            byStatus[key] = count;
            amountByStatus[key] = amount;
            total += count;
        }

        return {
            total,
            byStatus,
            amountByStatus
        };
    }

    async createOpportunity(data: { client_id: number; product: string; amount: number; status?: string; estimated_close_date?: string }, tenantId: number) {
        const status = data.status || 'pendiente';
        const closedStatuses = new Set(['ganado', 'ganada', 'perdido', 'perdida']);
        const result = await opportunityRepository.create({
            client_id: data.client_id,
            tenant_id: tenantId,
            product: data.product,
            amount: data.amount,
            status,
            estimated_close_date: closedStatuses.has(status)
                ? new Date()
                : (data.estimated_close_date ? new Date(data.estimated_close_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
        });
        await redisCache.invalidateTenantCache(tenantId, 'opportunities');
        await redisCache.invalidate(`dashboard:metrics:${tenantId}:*`);
        return result;
    }

    async updateOpportunityStatusById(tenantId: number, id: number, status: string, version?: number) {
        const opp = await opportunityRepository.findUnique(tenantId, id);
        if (!opp) throw new Error('Opportunity not found or access denied');

        const closedStatuses = new Set(['ganado', 'ganada', 'perdido', 'perdida']);
        const result = await opportunityRepository.update(tenantId, id, {
            status,
            ...(closedStatuses.has(status) && { estimated_close_date: new Date() }),
            ...(version !== undefined && { version })
        });

        await redisCache.invalidateTenantCache(tenantId, 'opportunities');
        await redisCache.invalidate(`dashboard:metrics:${tenantId}:*`);
        return result;
    }
}

export const opportunityService = new OpportunityService();
