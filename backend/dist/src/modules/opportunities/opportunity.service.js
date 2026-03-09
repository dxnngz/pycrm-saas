import { redisCache } from '../../core/redis.js';
import { opportunityRepository } from '../../repositories/opportunity.repository.js';
export class OpportunityService {
    async getAllOpportunities(tenantId, options = {}) {
        const { limit = 10, search = '', cursor } = options;
        const cacheKey = `cache:opportunities:${tenantId}:l${limit}:s${search}:c${cursor || 0}`;
        return await redisCache.getOrSet(cacheKey, 300, async () => {
            const [opportunities, total] = await Promise.all([
                opportunityRepository.findManyPaged(tenantId, { cursor, limit, search }),
                opportunityRepository.countSearch(tenantId, search)
            ]);
            const hasMore = opportunities.length > limit;
            const items = hasMore ? opportunities.slice(0, limit) : opportunities;
            const mappedData = items.map((opp) => ({
                ...opp,
                client_name: opp.client?.name || 'Cliente Desconocido',
                client_company: opp.client?.company || 'Empresa Desconocida'
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
    async createOpportunity(data, tenantId) {
        return await opportunityRepository.create({
            client_id: data.client_id,
            tenant_id: tenantId,
            product: data.product,
            amount: data.amount,
            status: data.status || 'pendiente',
            estimated_close_date: data.estimated_close_date ? new Date(data.estimated_close_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
    }
    async updateOpportunityStatusById(tenantId, id, status, version) {
        const opp = await opportunityRepository.findUnique(tenantId, id);
        if (!opp)
            throw new Error('Opportunity not found or access denied');
        if (version !== undefined) {
            return await opportunityRepository.update(tenantId, id, {
                status,
                version: { increment: 1 }
            });
        }
        else {
            return await opportunityRepository.update(tenantId, id, { status });
        }
    }
}
export const opportunityService = new OpportunityService();
