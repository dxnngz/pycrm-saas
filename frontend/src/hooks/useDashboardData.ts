import { useQuery } from '@tanstack/react-query';
import { opportunityService } from '../services/opportunity.service';
import { taskService } from '../services/task.service';
import { dashboardService } from '../services/dashboard.service';
import { predictFutureSales } from '../services/mlService';

export const useDashboardData = (period: 'monthly' | 'yearly') => {
    return useQuery({
        queryKey: ['dashboard_data', period],
        queryFn: async () => {
            const [oppsResponse, tasks, backendMetrics] = await Promise.all([
                opportunityService.getAll(1, 100),
                taskService.getAll(),
                dashboardService.getMetrics(period)
            ]);

            const opps = Array.isArray(oppsResponse?.data) ? oppsResponse.data : [];
            const tasksList = Array.isArray(tasks) ? tasks : [];
            const completedTasks = tasksList.filter(t => t.completed).length;
            const pendingTasks = tasksList.filter(t => !t.completed).length;

            const recentActivity = [
                ...opps.slice(0, 3).map(o => ({
                    id: `opp-${o.id}`,
                    type: 'sale' as const,
                    title: o.status === 'ganado' ? 'Sale Closed' : 'New Opportunity',
                    description: `${o.client_name || 'Prospect'} - ${o.product}`,
                    time: 'Recent',
                    amount: o.amount
                })),
                ...tasksList.slice(0, 2).map(t => ({
                    id: `task-${t.id}`,
                    type: t.completed ? 'task-done' as const : 'task-new' as const,
                    title: t.completed ? 'Task Finalized' : 'New Task Assigned',
                    description: t.title,
                    time: 'Today'
                }))
            ].sort(() => Math.random() - 0.5);

            const prediction = await predictFutureSales(opps.map(o => ({
                amount: o.amount,
                date: o.created_at || new Date().toISOString()
            })));

            return {
                rawOpps: opps,
                rawTasks: tasksList,
                stats: {
                    totalSales: backendMetrics?.totalSales || 0,
                    activeOpportunities: opps.filter(o => o.status === 'pendiente').length,
                    completedTasks,
                    pendingTasks,
                    recentActivity,
                    winRate: backendMetrics?.conversionRate || 0,
                    repPerformance: (backendMetrics?.repPerformance || []).slice(0, 5),
                    chartData: backendMetrics?.chartData || []
                },
                forecast: prediction,
                isCached: !!backendMetrics?._cached
            };
        },
    });
};
