import { prisma } from '../../core/prisma.js';
import { redisCache } from '../../core/redis.js';
import { logger } from '../../utils/logger.js';

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
                repPerformance: [],
                chartData: [],
                degraded: true,
                message: 'Operating in Degraded Mode (System Busy)'
            };
        }
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

        // Implementation of the original logic...
        // 1. Sales Metrics
        const salesResult: any = isYearly
            ? await prisma.$queryRaw`SELECT COALESCE(SUM(amount), 0) as total FROM opportunities WHERE status IN ('ganado', 'ganada') AND tenant_id = ${tenantId} AND COALESCE(estimated_close_date, created_at::date) >= ${rangeStart} AND COALESCE(estimated_close_date, created_at::date) < ${rangeEnd}`
            : await prisma.$queryRaw`SELECT COALESCE(SUM(amount), 0) as total FROM opportunities WHERE status IN ('ganado', 'ganada') AND tenant_id = ${tenantId} AND COALESCE(estimated_close_date, created_at::date) >= ${rangeStart} AND COALESCE(estimated_close_date, created_at::date) < ${rangeEnd}`;
        const totalSales = parseFloat(salesResult[0]?.total || 0);

        // 2. Conversion
        const metricsResult: any = isYearly
            ? await prisma.$queryRaw`SELECT COUNT(*) FILTER (WHERE status IN ('ganado', 'ganada')) as won, COUNT(*) FILTER (WHERE status IN ('ganado', 'ganada', 'perdido', 'perdida')) as closed, COALESCE(AVG(amount) FILTER (WHERE status IN ('ganado', 'ganada')), 0) as avg_ticket FROM opportunities WHERE tenant_id = ${tenantId} AND COALESCE(estimated_close_date, created_at::date) >= ${rangeStart} AND COALESCE(estimated_close_date, created_at::date) < ${rangeEnd}`
            : await prisma.$queryRaw`SELECT COUNT(*) FILTER (WHERE status IN ('ganado', 'ganada')) as won, COUNT(*) FILTER (WHERE status IN ('ganado', 'ganada', 'perdido', 'perdida')) as closed, COALESCE(AVG(amount) FILTER (WHERE status IN ('ganado', 'ganada')), 0) as avg_ticket FROM opportunities WHERE tenant_id = ${tenantId} AND COALESCE(estimated_close_date, created_at::date) >= ${rangeStart} AND COALESCE(estimated_close_date, created_at::date) < ${rangeEnd}`;

        const { won = 0, closed = 0, avg_ticket = 0 } = metricsResult[0] || {};
        const conversionRate = Number(closed) > 0 ? (Number(won) / Number(closed)) * 100 : 0;

        // 3. Rep Performance
        const repPerformanceResult: any = await prisma.$queryRaw`
            SELECT u.id, u.name, COALESCE(SUM(o.amount), 0) as total_sales
            FROM users u
            LEFT JOIN opportunities o ON u.id = o.assigned_to AND o.status IN ('ganado', 'ganada') AND o.tenant_id = ${tenantId} AND COALESCE(o.estimated_close_date, o.created_at::date) >= ${rangeStart} AND COALESCE(o.estimated_close_date, o.created_at::date) < ${rangeEnd}
            WHERE u.tenant_id = ${tenantId}
            GROUP BY u.id, u.name
            ORDER BY total_sales DESC
            LIMIT 5
        `;
        const repPerformance = repPerformanceResult.map((r: any) => ({
            id: r.id,
            name: r.name,
            total_sales: parseFloat(r.total_sales)
        }));

        // 4. Chart Data (Aligns with selected period)
        const chartDataResult: any = isYearly
            ? await prisma.$queryRaw`
                SELECT 
                    SUM(amount) as sales,
                    TO_CHAR(COALESCE(estimated_close_date, created_at::date), 'YYYY-MM') as sort_key
                FROM opportunities
                WHERE tenant_id = ${tenantId} AND status IN ('ganado', 'ganada')
                AND COALESCE(estimated_close_date, created_at::date) >= ${startOfYear} AND COALESCE(estimated_close_date, created_at::date) < ${nextYear}
                GROUP BY TO_CHAR(COALESCE(estimated_close_date, created_at::date), 'YYYY-MM')
                ORDER BY sort_key ASC
            `
            : await prisma.$queryRaw`
                SELECT 
                    SUM(amount) as sales,
                    TO_CHAR(COALESCE(estimated_close_date, created_at::date), 'YYYY-MM') as sort_key
                FROM opportunities
                WHERE tenant_id = ${tenantId} AND status IN ('ganado', 'ganada')
                AND COALESCE(estimated_close_date, created_at::date) >= ${chartStart} AND COALESCE(estimated_close_date, created_at::date) < ${nextMonth}
                GROUP BY TO_CHAR(COALESCE(estimated_close_date, created_at::date), 'YYYY-MM')
                ORDER BY sort_key ASC
            `;

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
            repPerformance,
            chartData
        };
    }
}

export const dashboardService = new DashboardService();
