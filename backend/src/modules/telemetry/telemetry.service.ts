import { redisCache } from '../../core/redis.js';
import { getMetrics } from '../../core/metrics.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TelemetryService {
    async getSystemOverview() {
        const redisStats = await redisCache.getTelemetry();
        const prometheusMetrics = await getMetrics();

        // Resource totals
        const [totalTenants, totalUsers, totalClients, totalOpps, totalTasks, totalEvents] = await Promise.all([
            prisma.tenant.count(),
            prisma.user.count(),
            prisma.client.count({ where: { deleted_at: null } }),
            prisma.opportunity.count({ where: { deleted_at: null } }),
            prisma.task.count({ where: { deleted_at: null } }),
            prisma.event.count()
        ]);

        // Success vs Error Ratio (Simplified)
        const totalLogs = await prisma.auditLog.count();
        const errorLogs = await prisma.auditLog.count({ where: { action: 'error' } });
        const successRate = totalLogs > 0 ? (((totalLogs - errorLogs) / totalLogs) * 100).toFixed(2) + '%' : '100%';

        // Recent events
        const recentEvents = await prisma.auditLog.findMany({
            take: 15,
            orderBy: { created_at: 'desc' },
            include: { tenant: { select: { name: true } } }
        });

        return {
            resources: {
                tenants: totalTenants,
                users: totalUsers,
                clients: totalClients,
                opportunities: totalOpps,
                tasks: totalTasks,
                events: totalEvents
            },
            health: {
                apiSuccessRate: successRate,
                redisStatus: redisStats?.hitRatio ? 'UP' : 'DEGRADED'
            },
            cache: redisStats,
            events: recentEvents,
            rawMetrics: prometheusMetrics
        };
    }

    async getTenantUsage(tenantId: number) {
        const [users, clients, opportunities] = await Promise.all([
            prisma.user.count({ where: { tenant_id: tenantId } }),
            prisma.client.count({ where: { tenant_id: tenantId, deleted_at: null } }),
            prisma.opportunity.count({ where: { tenant_id: tenantId, deleted_at: null } })
        ]);

        return {
            usage: {
                users,
                clients,
                opportunities
            }
        };
    }
}

export const telemetryService = new TelemetryService();
