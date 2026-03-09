import { Prisma } from '@prisma/client';
import { prisma } from '../../core/prisma.js';
import { redisCache } from '../../core/redis.js';

export class DashboardService {
    async getDashboardMetrics(tenantId: number, period: 'monthly' | 'yearly' = 'monthly') {
        const cacheKey = `dashboard:metrics:${tenantId}:${period}`;
        const cacheTtlSeconds = 300; // 5 minutos de caché (tiempo aceptable para analíticas)

        return await redisCache.getOrSet(cacheKey, cacheTtlSeconds, async () => {
            const isYearly = period === 'yearly';

            // Helper to get ranges
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

            // 1. Sales Metrics
            const salesResult: any = isYearly
                ? await prisma.$queryRaw`
                SELECT COALESCE(SUM(amount), 0) as total
                FROM opportunities
                WHERE status = 'ganado' AND tenant_id = ${tenantId}
                AND created_at >= ${startOfYear}
            `
                : await prisma.$queryRaw`
                SELECT COALESCE(SUM(amount), 0) as total
                FROM opportunities
                WHERE status = 'ganado' AND tenant_id = ${tenantId}
                AND created_at >= ${startOfMonth} AND created_at < ${nextMonth}
            `;
            const totalSales = parseFloat(salesResult[0]?.total || 0);

            // 2. Conversion & Average Ticket
            const metricsResult: any = isYearly
                ? await prisma.$queryRaw`
                SELECT 
                    COUNT(*) FILTER (WHERE status = 'ganado') as won,
                    COUNT(*) FILTER (WHERE status IN ('ganado', 'perdido')) as closed,
                    COALESCE(AVG(amount) FILTER (WHERE status = 'ganado'), 0) as avg_ticket
                FROM opportunities
                WHERE tenant_id = ${tenantId}
                AND created_at >= ${startOfYear}
            `
                : await prisma.$queryRaw`
                SELECT 
                    COUNT(*) FILTER (WHERE status = 'ganado') as won,
                    COUNT(*) FILTER (WHERE status IN ('ganado', 'perdido')) as closed,
                    COALESCE(AVG(amount) FILTER (WHERE status = 'ganado'), 0) as avg_ticket
                FROM opportunities
                WHERE tenant_id = ${tenantId}
                AND created_at >= ${startOfMonth} AND created_at < ${nextMonth}
            `;
            const { won = 0, closed = 0, avg_ticket = 0 } = metricsResult[0] || {};
            const conversionRate = Number(closed) > 0 ? (Number(won) / Number(closed)) * 100 : 0;
            const averageTicket = Number(avg_ticket);

            // 3. Sales Rep Performance
            const repPerformanceResult: any = isYearly
                ? await prisma.$queryRaw`
                SELECT u.id, u.name, COALESCE(SUM(o.amount), 0) as total_sales, COUNT(o.id) as deals_won
                FROM users u
                LEFT JOIN opportunities o ON u.id = o.assigned_to 
                    AND o.status = 'ganado'
                    AND o.tenant_id = ${tenantId}
                    AND o.created_at >= ${startOfYear}
                WHERE u.tenant_id = ${tenantId} AND (u.role = 'empleado' OR u.role = 'admin')
                GROUP BY u.id, u.name
                ORDER BY total_sales DESC
            `
                : await prisma.$queryRaw`
                SELECT u.id, u.name, COALESCE(SUM(o.amount), 0) as total_sales, COUNT(o.id) as deals_won
                FROM users u
                LEFT JOIN opportunities o ON u.id = o.assigned_to 
                    AND o.status = 'ganado'
                    AND o.tenant_id = ${tenantId}
                    AND o.created_at >= ${startOfMonth} AND o.created_at < ${nextMonth}
                WHERE u.tenant_id = ${tenantId} AND (u.role = 'empleado' OR u.role = 'admin')
                GROUP BY u.id, u.name
                ORDER BY total_sales DESC
            `;
            const repPerformance = repPerformanceResult.map((row: any) => ({
                id: row.id,
                name: row.name,
                total_sales: Number(row.total_sales || 0),
                deals_won: Number(row.deals_won || 0)
            }));

            // 4. Sales Chart Data
            let chartData = [];
            if (isYearly) {
                const chartResult: any = await prisma.$queryRaw`
                    SELECT 
                        TO_CHAR(date_trunc('month', created_at), 'Mon') as name,
                        SUM(amount) as sales
                    FROM opportunities
                    WHERE status = 'ganado' AND tenant_id = ${tenantId}
                    AND created_at >= ${startOfYear}
                    GROUP BY date_trunc('month', created_at)
                    ORDER BY date_trunc('month', created_at)
                `;
                chartData = chartResult.map((r: any) => ({ name: r.name, sales: Number(r.sales || 0) }));
            } else {
                const last30Days = new Date();
                last30Days.setDate(last30Days.getDate() - 30);

                const chartResult: any = await prisma.$queryRaw`
                    SELECT 
                        TO_CHAR(created_at, 'DD/MM') as name,
                        SUM(amount) as sales
                    FROM opportunities
                    WHERE status = 'ganado' AND tenant_id = ${tenantId}
                    AND created_at >= ${last30Days}
                    GROUP BY date_trunc('day', created_at), TO_CHAR(created_at, 'DD/MM')
                    ORDER BY date_trunc('day', created_at)
                `;
                chartData = chartResult.map((r: any) => ({ name: r.name, sales: Number(r.sales || 0) }));
            }

            return {
                totalSales,
                conversionRate,
                averageTicket,
                repPerformance,
                chartData
            };
        });
    }
}

export const dashboardService = new DashboardService();
