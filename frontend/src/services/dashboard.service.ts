import { customFetch, getHeaders, handleResponse } from './apiClient';

const dashboardCache = new Map<string, { data: unknown, timestamp: number }>();

export interface DashboardStats {
    totalSales: number;
    conversionRate: number;
    averageTicket: number;
    repPerformance: Array<{ id: string | number; name: string; total_sales: number }>;
    chartData: Array<{ name: string; sales: number }>;
    _cached?: boolean;
}

export const dashboardService = {
    getMetrics: async (period: string = 'monthly'): Promise<DashboardStats> => {
        const cacheKey = `metrics_${period}`;
        const cachedValue = dashboardCache.get(cacheKey);

        const fetchPromise = customFetch(`/dashboard/metrics?period=${period}`, { headers: getHeaders() })
            .then(handleResponse)
            .then(data => {
                dashboardCache.set(cacheKey, { data, timestamp: Date.now() });
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('dashboard_metrics_updated', { detail: { period, data } }));
                }
                return data;
            });

        if (cachedValue && (Date.now() - cachedValue.timestamp < 120000)) {
            return { ...(cachedValue.data as DashboardStats), _cached: true };
        }

        return fetchPromise;
    }
};
