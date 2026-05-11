import { prisma } from '../../core/prisma.js';
import { redisCache } from '../../core/redis.js';
import { logger } from '../../utils/logger.js';
import { Prisma } from '@prisma/client';
import { tenantService } from '../tenants/tenant.service.js';

export class DashboardService {
    async getDashboardMetrics(
        tenantId: number,
        period: 'monthly' | 'yearly' = 'monthly',
        options: { forceRefresh?: boolean } = {}
    ) {
        const cacheKey = `dashboard:metrics:${tenantId}:${period}`;
        const cacheTtlSeconds = 600; // 10 minutes

        try {
            if (options.forceRefresh) {
                await redisCache.invalidate(cacheKey);
            }

            // 1. ELITE SWR ARMOR: Attempt to get cached data for instant response
            const cachedData = await redisCache.get<any>(cacheKey);

            if (cachedData) {
                // Background Refresh: Update cache asynchronously if data is older than 2 minutes (SWR)
                const cacheAge = (new Date().getTime() - new Date(cachedData.timestamp || 0).getTime()) / 1000;
                if (cacheAge > 120) {
                    logger.info({ tenantId, period }, '🔄 [Dashboard] Triggering Background Refresh (SWR)');
                    this.fetchFreshMetrics(tenantId, period)
                        .then(fresh => redisCache.set(cacheKey, { ...fresh, timestamp: new Date().toISOString() }, cacheTtlSeconds))
                        .catch(err => logger.warn({ err }, 'Background refresh failed'));
                }

                return {
                    ...cachedData,
                    degraded: false,
                    cached: true
                };
            }

            // 2. No cache: Fetch fresh (Normal path)
            const freshData = await this.fetchFreshMetrics(tenantId, period);
            const result = {
                ...freshData,
                degraded: false,
                timestamp: new Date().toISOString()
            };

            await redisCache.set(cacheKey, result, cacheTtlSeconds);
            return result;

        } catch (error) {
            logger.error({ tenantId, period, error }, '❌ Dashboard Critical Failure. Falling back to DEGRADED MODE.');

            // 3. DEGRADED MODE ARMOR: Attempt to serve ANY data (even very stale) from cache
            const emergencyData = await redisCache.get<any>(cacheKey);

            if (emergencyData) {
                return {
                    ...emergencyData,
                    degraded: true,
                    message: 'Running on stale data (Degraded Mode)'
                };
            }

            // Absolute Fallback: Empty values to prevent frontend crash
            return {
                totalSales: 0,
                conversionRate: 0,
                averageTicket: 0,
                lossesByReason: [],
                repPerformance: [],
                chartData: [],
                degraded: true,
                message: 'Operating in Degraded Mode (System Busy)'
            };
        }
    }

    async getRecentActivity(tenantId: number, limit: number = 10) {
        const take = Number.isFinite(limit) ? Math.max(1, Math.min(50, Math.floor(limit))) : 10;
        const sets = await tenantService.getPipelineStatusSets(tenantId);

        const logs = await prisma.auditLog.findMany({
            where: {
                tenant_id: tenantId,
                entity: { in: ['Opportunity', 'Task', 'Client'] }
            },
            orderBy: { created_at: 'desc' },
            take,
            include: {
                user: { select: { name: true } }
            }
        });

        const oppIds = logs.filter(l => l.entity === 'Opportunity').map(l => l.entity_id);
        const taskIds = logs.filter(l => l.entity === 'Task').map(l => l.entity_id);
        const clientIds = logs.filter(l => l.entity === 'Client').map(l => l.entity_id);

        const [opps, tasks, clients] = await Promise.all([
            oppIds.length
                ? prisma.opportunity.findMany({
                    where: { tenant_id: tenantId, id: { in: oppIds }, deleted_at: null },
                    include: { client: { select: { name: true, company: true } } }
                })
                : Promise.resolve([]),
            taskIds.length
                ? prisma.task.findMany({
                    where: { tenant_id: tenantId, id: { in: taskIds } },
                    include: { client: { select: { name: true } } }
                })
                : Promise.resolve([]),
            clientIds.length
                ? prisma.client.findMany({
                    where: { tenant_id: tenantId, id: { in: clientIds }, deleted_at: null },
                    select: { id: true, name: true, company: true }
                })
                : Promise.resolve([]),
        ]);

        const oppById = new Map(opps.map(o => [o.id, o]));
        const taskById = new Map(tasks.map(t => [t.id, t]));
        const clientById = new Map(clients.map(c => [c.id, c]));

        return logs.map((log) => {
            const timestamp = log.created_at.toISOString();
            const actor = log.user?.name || 'Sistema';

            if (log.entity === 'Opportunity') {
                const opp = oppById.get(log.entity_id);
                const clientName = opp?.client?.name || 'Prospecto';
                const product = opp?.product || `Oportunidad #${log.entity_id}`;
                const amount = opp?.amount ? Number(opp.amount) : undefined;

                const updatedData = (log.changes as any)?.updatedData;
                const rawStatus = String(updatedData?.status || opp?.status || '').trim();
                const status = rawStatus === 'ganada' ? 'ganado' : rawStatus === 'perdida' ? 'perdido' : rawStatus;

                if (log.action === 'CREATE') {
                    return {
                        id: `audit-${log.id}`,
                        type: 'task-new',
                        title: 'Nueva oportunidad',
                        description: `${clientName} - ${product} · ${actor}`,
                        time: timestamp,
                        amount
                    };
                }

                if (sets.won.includes(status)) {
                    return {
                        id: `audit-${log.id}`,
                        type: 'sale',
                        title: 'Venta cerrada',
                        description: `${clientName} - ${product} · ${actor}`,
                        time: timestamp,
                        amount
                    };
                }

                if (sets.lost.includes(status)) {
                    return {
                        id: `audit-${log.id}`,
                        type: 'task-new',
                        title: 'Oportunidad perdida',
                        description: `${clientName} - ${product} · ${actor}`,
                        time: timestamp,
                        amount
                    };
                }

                return {
                    id: `audit-${log.id}`,
                    type: 'task-new',
                    title: 'Oportunidad actualizada',
                    description: `${clientName} - ${product} · ${actor}`,
                    time: timestamp,
                    amount
                };
            }

            if (log.entity === 'Task') {
                const task = taskById.get(log.entity_id);
                const title = task?.title || `Tarea #${log.entity_id}`;
                const clientName = task?.client?.name;
                const updatedData = (log.changes as any)?.updatedData;
                const completed = Boolean(updatedData?.completed ?? (log.changes as any)?.finalState?.completed ?? task?.completed);

                return {
                    id: `audit-${log.id}`,
                    type: completed ? 'task-done' : 'task-new',
                    title: completed ? 'Tarea finalizada' : (log.action === 'CREATE' ? 'Nueva tarea' : 'Tarea actualizada'),
                    description: `${clientName ? `${clientName} · ` : ''}${title} · ${actor}`,
                    time: timestamp
                };
            }

            if (log.entity === 'Client') {
                const client = clientById.get(log.entity_id);
                const name = client?.name || `Cliente #${log.entity_id}`;
                const company = client?.company ? ` (${client.company})` : '';

                return {
                    id: `audit-${log.id}`,
                    type: 'task-new',
                    title: log.action === 'CREATE' ? 'Nuevo cliente' : (log.action === 'DELETE' ? 'Cliente eliminado' : 'Cliente actualizado'),
                    description: `${name}${company} · ${actor}`,
                    time: timestamp
                };
            }

            return {
                id: `audit-${log.id}`,
                type: 'task-new',
                title: `${log.entity} ${log.action}`,
                description: `#${log.entity_id} · ${actor}`,
                time: timestamp
            };
        });
    }

    private async fetchFreshMetrics(tenantId: number, period: 'monthly' | 'yearly') {
        const isYearly = period === 'yearly';
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const nextYear = new Date(now.getFullYear() + 1, 0, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const chartStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const rangeStart = isYearly ? startOfYear : chartStart;
        const rangeEnd = isYearly ? nextYear : nextMonth;

        const sets = await tenantService.getPipelineStatusSets(tenantId);
        const wonStatuses = sets.won;
        const lostStatuses = sets.lost;
        const closedStatuses = sets.closed;

        const wonList = Prisma.join(wonStatuses.map(s => Prisma.sql`${s}`));
        const lostList = Prisma.join(lostStatuses.map(s => Prisma.sql`${s}`));
        const closedList = Prisma.join(closedStatuses.map(s => Prisma.sql`${s}`));

        // Implementation of the original logic...
        // 1. Sales Metrics
        const salesResult: any = await prisma.$queryRaw(Prisma.sql`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM opportunities
            WHERE status IN (${wonList})
              AND tenant_id = ${tenantId}
              AND deleted_at IS NULL
              AND COALESCE(closed_at, estimated_close_date, created_at::date) >= ${rangeStart}
              AND COALESCE(closed_at, estimated_close_date, created_at::date) < ${rangeEnd}
        `);
        const totalSales = parseFloat(salesResult[0]?.total || 0);

        // 2. Conversion
        const metricsResult: any = await prisma.$queryRaw(Prisma.sql`
            SELECT
                COUNT(*) FILTER (WHERE status IN (${wonList})) as won,
                COUNT(*) FILTER (WHERE status IN (${closedList})) as closed,
                COALESCE(AVG(amount) FILTER (WHERE status IN (${wonList})), 0) as avg_ticket
            FROM opportunities
            WHERE tenant_id = ${tenantId}
              AND deleted_at IS NULL
              AND COALESCE(closed_at, estimated_close_date, created_at::date) >= ${rangeStart}
              AND COALESCE(closed_at, estimated_close_date, created_at::date) < ${rangeEnd}
        `);

        const { won = 0, closed = 0, avg_ticket = 0 } = metricsResult[0] || {};
        const conversionRate = Number(closed) > 0 ? (Number(won) / Number(closed)) * 100 : 0;

        const lossesByReasonResult: any = await prisma.$queryRaw(Prisma.sql`
            SELECT
                COALESCE(NULLIF(TRIM(lost_reason), ''), 'Sin motivo') as reason,
                COUNT(*)::int as count,
                COALESCE(SUM(amount), 0) as amount
            FROM opportunities
            WHERE tenant_id = ${tenantId}
              AND status IN (${lostList})
              AND deleted_at IS NULL
              AND COALESCE(closed_at, estimated_close_date, created_at::date) >= ${rangeStart}
              AND COALESCE(closed_at, estimated_close_date, created_at::date) < ${rangeEnd}
            GROUP BY reason
            ORDER BY count DESC, amount DESC
            LIMIT 6
        `);

        const lossesByReason = (lossesByReasonResult || []).map((r: any) => ({
            reason: String(r.reason || '').trim() || 'Sin motivo',
            count: Number(r.count) || 0,
            amount: Number(r.amount) || 0,
        }));

        // 3. Rep Performance
        const repPerformanceResult: any = await prisma.$queryRaw(Prisma.sql`
            SELECT u.id, u.name, COALESCE(SUM(o.amount), 0) as total_sales
            FROM users u
            LEFT JOIN opportunities o
              ON u.id = o.assigned_to
             AND o.status IN (${wonList})
             AND o.tenant_id = ${tenantId}
             AND o.deleted_at IS NULL
             AND COALESCE(o.closed_at, o.estimated_close_date, o.created_at::date) >= ${rangeStart}
             AND COALESCE(o.closed_at, o.estimated_close_date, o.created_at::date) < ${rangeEnd}
            WHERE u.tenant_id = ${tenantId}
            GROUP BY u.id, u.name
            ORDER BY total_sales DESC
            LIMIT 5
        `);
        const repPerformance = repPerformanceResult.map((r: any) => ({
            id: r.id,
            name: r.name,
            total_sales: parseFloat(r.total_sales)
        }));

        // 4. Chart Data (Aligns with selected period)
        const chartDataResult: any = isYearly
            ? await prisma.$queryRaw(Prisma.sql`
                SELECT 
                    SUM(amount) as sales,
                    TO_CHAR(COALESCE(closed_at, estimated_close_date, created_at::date), 'YYYY-MM') as sort_key
                FROM opportunities
                WHERE tenant_id = ${tenantId} AND status IN (${wonList})
                AND deleted_at IS NULL
                AND COALESCE(closed_at, estimated_close_date, created_at::date) >= ${startOfYear} AND COALESCE(closed_at, estimated_close_date, created_at::date) < ${nextYear}
                GROUP BY TO_CHAR(COALESCE(closed_at, estimated_close_date, created_at::date), 'YYYY-MM')
                ORDER BY sort_key ASC
            `)
            : await prisma.$queryRaw(Prisma.sql`
                SELECT 
                    SUM(amount) as sales,
                    TO_CHAR(COALESCE(closed_at, estimated_close_date, created_at::date), 'YYYY-MM') as sort_key
                FROM opportunities
                WHERE tenant_id = ${tenantId} AND status IN (${wonList})
                AND deleted_at IS NULL
                AND COALESCE(closed_at, estimated_close_date, created_at::date) >= ${chartStart} AND COALESCE(closed_at, estimated_close_date, created_at::date) < ${nextMonth}
                GROUP BY TO_CHAR(COALESCE(closed_at, estimated_close_date, created_at::date), 'YYYY-MM')
                ORDER BY sort_key ASC
            `);

        const salesByKey = new Map<string, number>();
        for (const row of chartDataResult || []) {
            const key = String(row.sort_key || '').trim();
            if (!key) continue;
            const sales = parseFloat(row.sales) || 0;
            salesByKey.set(key, sales);
        }

        const chartLength = isYearly ? 12 : 6;
        const chartBase = isYearly ? startOfYear : chartStart;

        const chartData = Array.from({ length: chartLength }).map((_, i) => {
            const d = new Date(chartBase.getFullYear(), chartBase.getMonth() + i, 1);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const name = d.toLocaleString('es-ES', { month: 'short' });
            return { name, sales: salesByKey.get(monthKey) || 0 };
        });

        return {
            totalSales,
            conversionRate,
            averageTicket: Number(avg_ticket),
            lossesByReason,
            repPerformance,
            chartData
        };
    }
}

export const dashboardService = new DashboardService();
