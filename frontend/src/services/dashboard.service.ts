import { customFetch, getHeaders, handleResponse } from './apiClient';

export interface DashboardStats {
    totalSales: number;
    conversionRate: number;
    averageTicket: number;
    repPerformance: Array<{ id: string | number; name: string; total_sales: number }>;
    chartData: Array<{ name: string; sales: number }>;
    cached?: boolean;
    degraded?: boolean;
    timestamp?: string;
    message?: string;
}

export const dashboardService = {
    getMetrics: async (period: string = 'monthly', options: { forceRefresh?: boolean } = {}): Promise<DashboardStats> => {
        const refreshParam = options.forceRefresh ? '&refresh=1' : '';

        const data = await customFetch(`/dashboard/metrics?period=${period}${refreshParam}`, { headers: getHeaders() })
            .then(handleResponse);

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('dashboard_metrics_updated', { detail: { period, data } }));
        }

        return data as DashboardStats;
    }
};
