import { prisma } from '../../core/prisma.js';
import { redisCache } from '../../core/redis.js';
import { opportunityRepository } from '../../repositories/opportunity.repository.js';
import { AppError } from '../../utils/AppError.js';

export class OpportunityService {
    private parseOptionalDate(value: unknown, fieldLabel: string): Date | null | undefined {
        if (value === undefined) return undefined;
        if (value === null) return null;
        if (typeof value !== 'string') {
            throw new AppError(`${fieldLabel} inválida.`, 400);
        }
        const v = value.trim();
        if (!v) return null;
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) {
            throw new AppError(`${fieldLabel} inválida.`, 400);
        }
        return d;
    }

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

    async createOpportunity(data: { client_id: number; product: string; amount: number; status?: string; estimated_close_date?: string; notes?: string; source?: string; probability?: number; next_action_at?: string }, tenantId: number) {
        const status = data.status || 'pendiente';
        const closedStatuses = new Set(['ganado', 'ganada', 'perdido', 'perdida']);
        const isClosed = closedStatuses.has(status);
        const result = await opportunityRepository.create({
            client_id: data.client_id,
            tenant_id: tenantId,
            product: data.product,
            amount: data.amount,
            status,
            estimated_close_date: data.estimated_close_date
                ? new Date(data.estimated_close_date)
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            closed_at: isClosed ? new Date() : null,
            notes: data.notes?.trim() ? data.notes.trim() : null,
            source: data.source?.trim() ? data.source.trim() : null,
            probability: typeof data.probability === 'number' ? Math.max(0, Math.min(100, Math.floor(data.probability))) : 0,
            next_action_at: data.next_action_at ? this.parseOptionalDate(data.next_action_at, 'Fecha de próxima acción') : null
        });
        await redisCache.invalidateTenantCache(tenantId, 'opportunities');
        await redisCache.invalidate(`dashboard:metrics:${tenantId}:*`);
        return result;
    }

    async updateOpportunityById(
        tenantId: number,
        id: number,
        data: {
            client_id?: number;
            assigned_to?: number;
            product?: string;
            amount?: number;
            notes?: string;
            source?: string;
            probability?: number;
            estimated_close_date?: string;
            next_action_at?: string;
            version?: number;
        }
    ) {
        const updateData: any = {};

        if (data.client_id !== undefined) updateData.client_id = data.client_id;
        if (data.assigned_to !== undefined) updateData.assigned_to = data.assigned_to;
        if (data.product !== undefined) updateData.product = data.product;
        if (data.amount !== undefined) updateData.amount = data.amount;

        if (data.notes !== undefined) {
            const v = data.notes?.trim();
            updateData.notes = v ? v : null;
        }

        if (data.source !== undefined) {
            const v = data.source?.trim();
            updateData.source = v ? v : null;
        }

        if (data.probability !== undefined) {
            updateData.probability = Math.max(0, Math.min(100, Math.floor(Number(data.probability))));
        }

        const estimatedClose = this.parseOptionalDate(data.estimated_close_date, 'Fecha estimada de cierre');
        if (estimatedClose !== undefined) updateData.estimated_close_date = estimatedClose;

        const nextActionAt = this.parseOptionalDate(data.next_action_at, 'Fecha de próxima acción');
        if (nextActionAt !== undefined) updateData.next_action_at = nextActionAt;

        const result = await opportunityRepository.update(tenantId, id, {
            ...updateData,
            ...(data.version !== undefined && { version: data.version })
        });

        await redisCache.invalidateTenantCache(tenantId, 'opportunities');
        await redisCache.invalidate(`dashboard:metrics:${tenantId}:*`);
        return result;
    }

    async updateOpportunityStatusById(
        tenantId: number,
        id: number,
        status: string,
        options: { version?: number; lost_reason?: string; lost_reason_detail?: string } = {}
    ) {
        const opp = await opportunityRepository.findUnique(tenantId, id);
        if (!opp) throw new Error('Opportunity not found or access denied');

        const closedStatuses = new Set(['ganado', 'ganada', 'perdido', 'perdida']);
        const isClosed = closedStatuses.has(status);
        const isLost = status === 'perdido' || status === 'perdida';

        const lostReason = options.lost_reason?.trim();
        const lostReasonDetail = options.lost_reason_detail?.trim();

        if (isLost && !lostReason) {
            throw new AppError('Indica un motivo de pérdida para marcar la oportunidad como perdida.', 400);
        }

        const result = await opportunityRepository.update(tenantId, id, {
            status,
            closed_at: isClosed ? new Date() : null,
            lost_reason: isLost ? lostReason : null,
            lost_reason_detail: isLost ? (lostReasonDetail || null) : null,
            ...(options.version !== undefined && { version: options.version })
        });

        await redisCache.invalidateTenantCache(tenantId, 'opportunities');
        await redisCache.invalidate(`dashboard:metrics:${tenantId}:*`);
        return result;
    }
}

export const opportunityService = new OpportunityService();
