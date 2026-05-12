import { prisma } from '../../core/prisma.js';
import { redisCache } from '../../core/redis.js';
import { opportunityRepository } from '../../repositories/opportunity.repository.js';
import { AppError } from '../../utils/AppError.js';
import { tenantService } from '../tenants/tenant.service.js';
import { Prisma } from '@prisma/client';

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

    async getAllOpportunities(
        tenantId: number,
        options: {
            limit?: number;
            search?: string;
            cursor?: number;
            status?: string;
            assigned_to?: number;
            amount_min?: number;
            amount_max?: number;
            overdue?: boolean;
        } = {}
    ) {
        const { limit = 10, search = '', cursor, status, assigned_to, amount_min, amount_max, overdue } = options;
        const cacheKey = `cache:opportunities:${tenantId}:l${limit}:s${search}:c${cursor || 0}:st${status || ''}:a${assigned_to || 0}:min${amount_min ?? ''}:max${amount_max ?? ''}:od${overdue ? 1 : 0}`;

        return await redisCache.getOrSet(cacheKey, 300, async () => {
            const [opportunities, total] = await Promise.all([
                opportunityRepository.findManyPaged(tenantId, { cursor, limit, search, status, assigned_to, amount_min, amount_max, overdue }),
                opportunityRepository.countFiltered(tenantId, { search, status, assigned_to, amount_min, amount_max, overdue })
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

    async getOpportunitySummary(
        tenantId: number,
        options: { search?: string; status?: string; assigned_to?: number; amount_min?: number; amount_max?: number; overdue?: boolean } = {}
    ) {
        const search = (options.search || '').trim();
        const status = options.status?.trim();
        const assignedTo = options.assigned_to;
        const amountMin = options.amount_min;
        const amountMax = options.amount_max;
        const overdue = !!options.overdue;
        const q = `%${search}%`;

        const normalizeStatus = (value: unknown): string => {
            const s = String(value || '').trim();
            if (s === 'ganada') return 'ganado';
            if (s === 'perdida') return 'perdido';
            return s || 'pendiente';
        };

        const expandStatusFilter = (s?: string): string[] | undefined => {
            const v = (s || '').trim();
            if (!v) return undefined;
            if (v === 'ganado') return ['ganado', 'ganada'];
            if (v === 'ganada') return ['ganada', 'ganado'];
            if (v === 'perdido') return ['perdido', 'perdida'];
            if (v === 'perdida') return ['perdida', 'perdido'];
            return [v];
        };

        let rows: Array<{ status_norm: string; count: number; amount: any }> = [];
        try {
            rows = await prisma.$queryRaw`
                SELECT 
                    CASE
                        WHEN o.status = 'ganada' THEN 'ganado'
                        WHEN o.status = 'perdida' THEN 'perdido'
                        ELSE COALESCE(o.status, 'pendiente')
                    END as status_norm,
                    COUNT(*)::int as count,
                    COALESCE(SUM(o.amount), 0) as amount
                FROM opportunities o
                LEFT JOIN clients c ON c.id = o.client_id AND c.tenant_id = ${tenantId} AND c.deleted_at IS NULL
                WHERE o.tenant_id = ${tenantId}
                  AND o.deleted_at IS NULL
                  AND (
                    ${status || null} IS NULL
                    OR (
                        CASE
                            WHEN o.status = 'ganada' THEN 'ganado'
                            WHEN o.status = 'perdida' THEN 'perdido'
                            ELSE COALESCE(o.status, 'pendiente')
                        END
                    ) = ${status || null}
                  )
                  AND (${assignedTo ?? null} IS NULL OR o.assigned_to = ${assignedTo ?? null})
                  AND (${amountMin ?? null} IS NULL OR o.amount >= ${amountMin ?? null})
                  AND (${amountMax ?? null} IS NULL OR o.amount <= ${amountMax ?? null})
                  AND (${overdue} = false OR (o.next_action_at IS NOT NULL AND o.next_action_at < NOW()))
                  AND (
                    ${search} = ''
                    OR o.product ILIKE ${q}
                    OR c.name ILIKE ${q}
                    OR c.company ILIKE ${q}
                  )
                GROUP BY 1
            `;
        } catch {
            const statusIn = expandStatusFilter(status);
            const where: any = {
                tenant_id: tenantId,
                deleted_at: null,
                ...(assignedTo ? { assigned_to: assignedTo } : {}),
                ...(amountMin !== undefined ? { amount: { gte: new Prisma.Decimal(amountMin) } } : {}),
                ...(amountMax !== undefined ? { amount: { ...(amountMin !== undefined ? { gte: new Prisma.Decimal(amountMin) } : {}), lte: new Prisma.Decimal(amountMax) } } : {}),
                ...(overdue ? { next_action_at: { lt: new Date() } } : {}),
                ...(statusIn ? { status: { in: statusIn } } : {}),
                ...(search
                    ? {
                        OR: [
                            { product: { contains: search, mode: 'insensitive' } },
                            {
                                client: {
                                    is: {
                                        deleted_at: null,
                                        tenant_id: tenantId,
                                        OR: [
                                            { name: { contains: search, mode: 'insensitive' } },
                                            { company: { contains: search, mode: 'insensitive' } },
                                        ]
                                    }
                                }
                            }
                        ]
                    }
                    : {}),
            };

            const grouped = await prisma.opportunity.groupBy({
                by: ['status'],
                where,
                _count: { _all: true },
                _sum: { amount: true },
            });

            rows = grouped.map((g) => ({
                status_norm: normalizeStatus(g.status),
                count: Number(g._count._all) || 0,
                amount: g._sum.amount ?? 0,
            }));
        }

        const stages = await tenantService.getPipelineStages(tenantId);
        const byStatus: Record<string, number> = {};
        const amountByStatus: Record<string, number> = {};
        for (const s of stages) {
            byStatus[s.id] = 0;
            amountByStatus[s.id] = 0;
        }

        let total = 0;
        for (const r of rows || []) {
            const key = String((r as any).status_norm || '').trim();
            const count = Number((r as any).count) || 0;
            const amount = Number((r as any).amount) || 0;
            if (byStatus[key] !== undefined) {
                byStatus[key] = count;
                amountByStatus[key] = amount;
                total += count;
            } else {
                byStatus[key] = count;
                amountByStatus[key] = amount;
                total += count;
            }
        }

        return {
            total,
            byStatus,
            amountByStatus,
            stages
        };
    }

    async createOpportunity(data: { client_id: number; product: string; amount: number; status?: string; estimated_close_date?: string; notes?: string; source?: string; probability?: number; next_action_at?: string }, tenantId: number) {
        const sets = await tenantService.getPipelineStatusSets(tenantId);
        const rawStatus = typeof data.status === 'string' ? data.status.trim() : '';
        let status = rawStatus === 'ganada' ? 'ganado' : rawStatus === 'perdida' ? 'perdido' : rawStatus;
        if (!status) {
            const stages = await tenantService.getPipelineStages(tenantId);
            status = stages.find(s => s.category === 'open')?.id || stages[0]?.id || 'pendiente';
        }
        if (!sets.all.includes(status)) {
            throw new AppError('Etapa de oportunidad inválida.', 400);
        }
        const isClosed = sets.closed.includes(status);
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

        const rawStatus = (status || '').trim();
        const nextStatus = rawStatus === 'ganada' ? 'ganado' : rawStatus === 'perdida' ? 'perdido' : rawStatus;
        const sets = await tenantService.getPipelineStatusSets(tenantId);
        if (!sets.all.includes(nextStatus)) {
            throw new AppError('Etapa de oportunidad inválida.', 400);
        }

        const isClosed = sets.closed.includes(nextStatus);
        const isLost = sets.lost.includes(nextStatus);

        const lostReason = options.lost_reason?.trim();
        const lostReasonDetail = options.lost_reason_detail?.trim();

        if (isLost && !lostReason) {
            throw new AppError('Indica un motivo de pérdida para marcar la oportunidad como perdida.', 400);
        }

        const result = await opportunityRepository.update(tenantId, id, {
            status: nextStatus,
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
