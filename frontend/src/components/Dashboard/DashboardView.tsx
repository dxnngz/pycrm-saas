import { useState, lazy, Suspense } from 'react';
import {
    Download,
    RefreshCw,
    LayoutDashboard
} from 'lucide-react';

// UI Kit & Layout
import { Button } from '../UI/Button';
import { Tabs } from '../UI/Tabs';
import { Skeleton } from '../UI/Skeleton';
import { Badge } from '../UI/Badge';

// Dashboard Components (Lazy Loaded)
const SalesChart = lazy(() => import('./SalesChart'));
const RecentActivity = lazy(() => import('./RecentActivity'));

import ExecutiveBriefing from './ExecutiveBriefing';
import SmartAlerts from './SmartAlerts';
import { StatsGrid } from './StatsGrid';
import { PerformanceList } from './PerformanceList';

// Logic & Utilities
import { useDashboardData } from '../../hooks/useDashboardData';
import { generatePipelineReport } from '../../services/reportService';

const DashboardSkeleton = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
            <div className="space-y-3">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-72" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="lg:col-span-2 h-[420px] rounded-xl" />
            <Skeleton className="lg:col-span-1 h-[420px] rounded-xl" />
        </div>
    </div>
);

const DashboardView = () => {
    const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
    const { data, isLoading: loading, isFetching, refetch } = useDashboardData(period);

    const stats = data?.stats || {
        totalSales: 0,
        activeOpportunities: 0,
        winRate: 0,
        pendingTasks: 0,
        recentActivity: [],
        repPerformance: [],
        chartData: []
    };
    const isCached = !isFetching && data?.isCached;

    const handleExport = () => {
        if (data?.rawOpps) {
            generatePipelineReport(data.rawOpps);
        }
    };

    if (loading) return <DashboardSkeleton />;

    return (
        <div className="space-y-6 pb-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <LayoutDashboard size={20} className="text-primary-600 dark:text-primary-400" />
                        Executive Dashboard
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Operational oversight and real-time commercial network analytics.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Tabs
                        tabs={[
                            { id: 'monthly', label: 'Monthly' },
                            { id: 'yearly', label: 'Yearly' }
                        ]}
                        activeTab={period}
                        onChange={(id) => setPeriod(id as any)}
                    />

                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="p-2 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-400 disabled:opacity-50"
                        title="Force refresh"
                    >
                        <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                    </button>

                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download size={14} className="mr-2" />
                        Generate Report
                    </Button>
                </div>
            </div>

            {/* Core Stats */}
            <StatsGrid stats={stats} />

            {/* Analysis Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">Revenue Analysis</h3>
                            <p className="text-[9px] text-slate-500 font-bold mt-0.5 uppercase tracking-tight">Time-series performance metrics</p>
                        </div>
                        {isCached && (
                            <Badge variant="success" className="animate-pulse">Optimized</Badge>
                        )}
                    </div>
                    <div className="h-[320px]">
                        <Suspense fallback={<Skeleton className="w-full h-full rounded-lg" />}>
                            <SalesChart data={stats.chartData} />
                        </Suspense>
                    </div>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <SmartAlerts />
                    <ExecutiveBriefing />
                </div>
            </div>

            {/* Activity & Performance Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
                    <RecentActivity activities={stats.recentActivity} />
                </Suspense>
                <PerformanceList performance={stats.repPerformance} />
            </div>
        </div>
    );
};

export default DashboardView;
