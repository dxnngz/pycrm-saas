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

    async createOpportunity(data: { client_id: number; product: string; amount: number; status?: string; estimated_close_date?: string }, tenantId: number) {
        const result = await opportunityRepository.create({
            client_id: data.client_id,
            tenant_id: tenantId,
            product: data.product,
            amount: data.amount,
            status: data.status || 'pendiente',
            estimated_close_date: data.estimated_close_date ? new Date(data.estimated_close_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        await redisCache.invalidateTenantCache(tenantId, 'opportunities');
        await redisCache.invalidateTenantCache(tenantId, 'dashboard');
        return result;
    }

    async updateOpportunityStatusById(tenantId: number, id: number, status: string, version?: number) {
        const opp = await opportunityRepository.findUnique(tenantId, id);
        if (!opp) throw new Error('Opportunity not found or access denied');

        const result = await opportunityRepository.update(tenantId, id, {
            status,
            ...(version !== undefined && { version })
        });

        await redisCache.invalidateTenantCache(tenantId, 'opportunities');
        await redisCache.invalidateTenantCache(tenantId, 'dashboard');
        return result;
    }
}

export const opportunityService = new OpportunityService();
