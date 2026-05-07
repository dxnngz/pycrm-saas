import { useQuery } from '@tanstack/react-query';
import { opportunityService } from '../services/opportunity.service';
import { taskService } from '../services/task.service';
import { dashboardService } from '../services/dashboard.service';
import { predictFutureSales } from '../services/mlService';
import { formatMonthDay } from '../utils/format';

export const useDashboardData = (period: 'monthly' | 'yearly', refreshNonce: number = 0) => {
    return useQuery({
        queryKey: ['dashboard_data', period, refreshNonce],
        queryFn: async () => {
            const [oppsResponse, tasks, backendMetrics, activity] = await Promise.all([
                opportunityService.getAll({ limit: 1000 }),
                taskService.getAll(),
                dashboardService.getMetrics(period, { forceRefresh: refreshNonce > 0 }),
                dashboardService.getActivity(12).catch(() => [])
            ]);

            const opps = Array.isArray(oppsResponse?.data) ? oppsResponse.data : [];
            const tasksList = Array.isArray(tasks) ? tasks : [];
            const completedTasks = tasksList.filter(t => t.completed).length;
            const pendingTasks = tasksList.filter(t => !t.completed).length;

            const closedStatuses = new Set(['ganado', 'ganada', 'perdido', 'perdida']);
            const activeOpportunities = opps.filter(o => !closedStatuses.has(o.status)).length;

            const formatActivityTime = (value: string) => {
                const d = new Date(value);
                if (Number.isNaN(d.getTime())) return '';
                const diffMs = Date.now() - d.getTime();
                if (diffMs < 60_000) return 'Ahora';
                if (diffMs < 24 * 60 * 60_000) return 'Hoy';
                return formatMonthDay(d);
            };

            const sortedOpps = [...opps].sort((a, b) => {
                const da = a.created_at ? new Date(a.created_at).getTime() : 0;
                const db = b.created_at ? new Date(b.created_at).getTime() : 0;
                return db - da;
            });

            const fallbackActivity = [
                ...sortedOpps.slice(0, 3).map(o => ({
                    id: `opp-${o.id}`,
                    type: 'sale' as const,
                    title: (o.status === 'ganado' || o.status === 'ganada') ? 'Venta cerrada' : 'Nueva oportunidad',
                    description: `${o.client_name || 'Prospecto'} - ${o.product}`,
                    time: 'Reciente',
                    amount: Number(o.amount)
                })),
                ...tasksList.slice(0, 2).map(t => ({
                    id: `task-${t.id}`,
                    type: t.completed ? 'task-done' as const : 'task-new' as const,
                    title: t.completed ? 'Tarea finalizada' : 'Nueva tarea asignada',
                    description: t.title,
                    time: 'Hoy'
                }))
            ];

            const recentActivity = Array.isArray(activity) && activity.length > 0
                ? activity.map((a) => ({ ...a, time: formatActivityTime(a.time) }))
                : fallbackActivity;

            const prediction = await predictFutureSales(opps.map(o => ({
                amount: Number(o.amount),
                date: o.created_at || new Date().toISOString()
            })));

            return {
                rawOpps: opps,
                rawTasks: tasksList,
                stats: {
                    totalSales: backendMetrics?.totalSales || 0,
                    activeOpportunities,
                    completedTasks,
                    pendingTasks,
                    recentActivity,
                    winRate: backendMetrics?.conversionRate || 0,
                    repPerformance: (backendMetrics?.repPerformance || []).slice(0, 5),
                    chartData: backendMetrics?.chartData || []
                },
                forecast: prediction,
                isCached: !!backendMetrics?.cached,
                degraded: !!backendMetrics?.degraded,
                message: backendMetrics?.message,
                lastUpdated: backendMetrics?.timestamp
            };
        },
    });
};
