import { Prisma } from '@prisma/client';
import { prisma } from '../../core/prisma.js';
import { redisCache } from '../../core/redis.js';
import { logger } from '../../utils/logger.js';

export class DashboardService {
    async getDashboardMetrics(tenantId: number, period: 'monthly' | 'yearly' = 'monthly') {
        const cacheKey = `dashboard:metrics:${tenantId}:${period}`;
        const cacheTtlSeconds = 600; // 10 minutes

        try {
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
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        // Implementation of the original logic...
        // 1. Sales Metrics
        const salesResult: any = isYearly
            ? await prisma.$queryRaw`SELECT COALESCE(SUM(amount), 0) as total FROM opportunities WHERE status = 'ganado' AND tenant_id = ${tenantId} AND created_at >= ${startOfYear}`
            : await prisma.$queryRaw`SELECT COALESCE(SUM(amount), 0) as total FROM opportunities WHERE status = 'ganado' AND tenant_id = ${tenantId} AND created_at >= ${startOfMonth} AND created_at < ${nextMonth}`;
        const totalSales = parseFloat(salesResult[0]?.total || 0);

        // 2. Conversion
        const metricsResult: any = isYearly
            ? await prisma.$queryRaw`SELECT COUNT(*) FILTER (WHERE status = 'ganado') as won, COUNT(*) FILTER (WHERE status IN ('ganado', 'perdido')) as closed, COALESCE(AVG(amount) FILTER (WHERE status = 'ganado'), 0) as avg_ticket FROM opportunities WHERE tenant_id = ${tenantId} AND created_at >= ${startOfYear}`
            : await prisma.$queryRaw`SELECT COUNT(*) FILTER (WHERE status = 'ganado') as won, COUNT(*) FILTER (WHERE status IN ('ganado', 'perdido')) as closed, COALESCE(AVG(amount) FILTER (WHERE status = 'ganado'), 0) as avg_ticket FROM opportunities WHERE tenant_id = ${tenantId} AND created_at >= ${startOfMonth} AND created_at < ${nextMonth}`;

        const { won = 0, closed = 0, avg_ticket = 0 } = metricsResult[0] || {};
        const conversionRate = Number(closed) > 0 ? (Number(won) / Number(closed)) * 100 : 0;

        // 3. Rep Performance
        const repPerformanceResult: any = await prisma.$queryRaw`
            SELECT u.id, u.name, COALESCE(SUM(o.amount), 0) as total_sales
            FROM users u
            LEFT JOIN opportunities o ON u.id = o.assigned_to AND o.status = 'ganado' AND o.tenant_id = ${tenantId}
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

        // 4. Chart Data (Monthly trend for the last 6 months)
        const chartDataResult: any = await prisma.$queryRaw`
            SELECT 
                TO_CHAR(created_at, 'Mon') as name,
                SUM(amount) as sales,
                TO_CHAR(created_at, 'YYYY-MM') as sort_key
            FROM opportunities
            WHERE tenant_id = ${tenantId} AND status = 'ganado'
            AND created_at >= ${new Date(now.getFullYear(), now.getMonth() - 5, 1)}
            GROUP BY TO_CHAR(created_at, 'Mon'), TO_CHAR(created_at, 'YYYY-MM')
            ORDER BY sort_key ASC
        `;
        const chartData = chartDataResult.map((c: any) => ({
            name: c.name,
            sales: parseFloat(c.sales)
        }));

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
