import { useEffect, useState, lazy, Suspense } from 'react';
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
import { Card } from '../UI/Card';
import { Alert } from '../UI/Alert';

// Dashboard Components (Lazy Loaded)
const SalesChart = lazy(() => import('./SalesChart'));
const RecentActivity = lazy(() => import('./RecentActivity'));
const SmartAlerts = lazy(() => import('./SmartAlerts'));
const ExecutiveBriefing = lazy(() => import('./ExecutiveBriefing'));
const StatsGrid = lazy(() => import('./StatsGrid'));
const PerformanceList = lazy(() => import('./PerformanceList'));

// Logic & Utilities
import { useDashboardData } from '../../hooks/useDashboardData';
import { demoService } from '../../services/demo.service';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

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
    const [refreshNonce, setRefreshNonce] = useState(0);
    const [seeding, setSeeding] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        setRefreshNonce(0);
    }, [period]);

    const { data, isLoading: loading, isFetching } = useDashboardData(period, refreshNonce);

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
    const degraded = !!data?.degraded;
    const lastUpdated = data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString('es-ES') : null;
    const isEmpty =
        stats.totalSales === 0 &&
        stats.activeOpportunities === 0 &&
        stats.pendingTasks === 0 &&
        stats.winRate === 0 &&
        (stats.recentActivity?.length || 0) === 0 &&
        (stats.repPerformance?.length || 0) === 0 &&
        (stats.chartData?.length || 0) === 0;

    const handleExport = async () => {
        if (data?.rawOpps) {
            const { generatePipelineReport } = await import('../../services/reportService');
            generatePipelineReport(data.rawOpps);
        }
    };

    const handleSeedDemo = async () => {
        setSeeding(true);
        try {
            const res = await demoService.seed();
            toast.success(res.message || 'Datos de demostración creados');
            setRefreshNonce((n) => n + 1);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'No se pudieron crear los datos de demostración';
            toast.error(msg);
        } finally {
            setSeeding(false);
        }
    };

    if (loading) return <DashboardSkeleton />;

    return (
        <div className="space-y-6 pb-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-xl font-bold tracking-tight text-surface-text flex items-center gap-2">
                        <LayoutDashboard size={20} className="text-primary-600" />
                        Panel Ejecutivo
                    </h1>
                    <p className="text-xs text-surface-muted">
                        Control operativo y analítica comercial en tiempo real{lastUpdated ? ` · Actualizado: ${lastUpdated}` : ''}.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Tabs
                        tabs={[
                            { id: 'monthly', label: '6 meses' },
                            { id: 'yearly', label: 'Año' }
                        ]}
                        activeTab={period}
                        onChange={(id: string) => setPeriod(id as 'monthly' | 'yearly')}
                    />

                    <button
                        onClick={() => setRefreshNonce((n) => n + 1)}
                        disabled={isFetching}
                        className="p-2 border border-surface-border rounded-md hover:bg-surface-hover transition-all text-surface-muted disabled:opacity-50"
                        title="Actualizar"
                    >
                        <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                    </button>

                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download size={14} className="mr-2" />
                        Generar informe
                    </Button>
                </div>
            </div>

            {/* Core Stats */}
            <Suspense fallback={<Skeleton className="h-28 w-full rounded-xl" />}>
                <StatsGrid stats={stats} period={period} />
            </Suspense>

            {degraded && (
                <Alert variant="warning" title="Datos temporales">
                    {data?.message || 'Algunas métricas pueden estar desactualizadas. Usa “Actualizar” para forzar un recálculo.'}
                </Alert>
            )}

            {isEmpty && (
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <Alert variant="info" title="El panel está vacío">
                            Crea tu primer cliente, oportunidades y tareas — o genera datos demo para que la app se vea completa en la presentación.
                        </Alert>
                    </div>
                    {user?.role === 'admin' && (
                        <Button variant="primary" size="sm" onClick={handleSeedDemo} isLoading={seeding}>
                            Crear datos demo
                        </Button>
                    )}
                </div>
            )}

            {/* Analysis Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 flex flex-col min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-[11px] font-bold text-surface-text uppercase tracking-wider">Análisis de ingresos</h3>
                            <p className="text-[9px] text-surface-muted font-bold mt-0.5 uppercase tracking-tight">Métricas por periodo</p>
                        </div>
                        {isCached && (
                            <Badge variant="success" className="animate-pulse">Optimizado</Badge>
                        )}
                    </div>
                    <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                        <Suspense fallback={<Skeleton className="w-full h-full rounded-lg" />}>
                            <SalesChart data={stats.chartData} />
                        </Suspense>
                    </div>
                </Card>
                <div className="lg:col-span-1 space-y-6">
                    <Suspense fallback={<Skeleton className="h-28 w-full rounded-xl" />}>
                        <SmartAlerts />
                    </Suspense>
                    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
                        <ExecutiveBriefing />
                    </Suspense>
                </div>
            </div>

            {/* Activity & Performance Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
                    <RecentActivity activities={stats.recentActivity} />
                </Suspense>
                <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
                    <PerformanceList performance={stats.repPerformance} />
                </Suspense>
            </div>
        </div>
    );
};

export default DashboardView;
