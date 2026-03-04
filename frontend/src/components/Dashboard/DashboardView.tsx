import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    TrendingUp,
    Briefcase,
    CheckSquare,
    Download,
    BrainCircuit,
    Trophy,
    Sparkles,
    Target,
    ShieldCheck,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SalesChart from './SalesChart';
import StatCard from './StatCard';
import RecentActivity from './RecentActivity';
import ExecutiveBriefing from './ExecutiveBriefing';
import AIBanner from './AIBanner';
import { api } from '../../services/api';
import { predictFutureSales } from '../../services/mlService';
import { generatePipelineReport } from '../../services/reportService';
import type { RecentActivityItem, Opportunity } from '../../types';

interface DashboardStats {
    totalSales: number;
    activeOpportunities: number;
    completedTasks: number;
    pendingTasks: number;
    recentActivity: RecentActivityItem[];
    winRate: number;
    repPerformance: { id: number, name: string, total_sales: number, deals_won: number }[];
    chartData: { name: string; sales: number }[];
}

const DashboardSkeleton = () => (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse p-4 lg:p-8">
        {/* Header Skeleton */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3">
                <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                <div className="h-12 w-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
            </div>
            <div className="flex gap-3">
                <div className="h-12 w-40 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                <div className="h-12 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            </div>
        </div>

        {/* Executive Banner Skeleton */}
        <div className="h-[120px] w-full bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
            ))}
        </div>

        {/* Chart & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-[400px] bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]"></div>
            <div className="lg:col-span-1 h-[400px] bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]"></div>
        </div>
    </div>
);

const DashboardView = () => {
    const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

    const { data, isLoading: loading, isFetching: isRefreshing, refetch } = useQuery({
        queryKey: ['dashboard_data', period],
        queryFn: async () => {
            const [oppsResponse, tasks, backendMetrics] = await Promise.all([
                api.opportunities.getAll(1, 100),
                api.tasks.getAll(),
                api.dashboard.getMetrics(period)
            ]);

            const opps = Array.isArray(oppsResponse?.data) ? oppsResponse.data : [];
            const tasksList = Array.isArray(tasks) ? tasks : [];
            const completedTasks = tasksList.filter(t => t.completed).length;
            const pendingTasks = tasksList.filter(t => !t.completed).length;

            const recentActivity = [
                ...opps.slice(0, 3).map(o => ({
                    id: `opp-${o.id}`,
                    type: 'sale' as const,
                    title: o.status === 'ganado' ? 'Venta Cerrada' : 'Nueva Oportunidad',
                    description: `${o.client_name || 'Cliente'} - ${o.product}`,
                    time: 'Reciente',
                    amount: o.amount
                })),
                ...tasksList.slice(0, 2).map(t => ({
                    id: `task-${t.id}`,
                    type: t.completed ? 'task-done' as const : 'task-new' as const,
                    title: t.completed ? 'Tarea Finalizada' : 'Nueva Tarea Asignada',
                    description: t.title,
                    time: 'Hoy'
                }))
            ].sort(() => Math.random() - 0.5);

            const prediction = await predictFutureSales(opps.map(o => ({
                amount: o.amount,
                date: o.created_at || new Date().toISOString()
            })));

            return {
                rawOpps: opps,
                stats: {
                    totalSales: backendMetrics?.totalSales || 0,
                    activeOpportunities: opps.filter(o => o.status === 'pendiente').length,
                    completedTasks,
                    pendingTasks,
                    recentActivity,
                    winRate: backendMetrics?.conversionRate || 0,
                    repPerformance: backendMetrics?.repPerformance || [],
                    chartData: backendMetrics?.chartData || []
                },
                forecast: prediction,
                isCached: !!backendMetrics?._cached
            };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes fresh
    });

    const stats = data?.stats || {
        totalSales: 0,
        activeOpportunities: 0,
        completedTasks: 0,
        pendingTasks: 0,
        recentActivity: [],
        winRate: 0,
        repPerformance: [],
        chartData: []
    };
    const rawOpps = data?.rawOpps || [];
    const forecast = data?.forecast || null;
    const isCached = !isRefreshing && data?.isCached;

    const handleExportReport = () => {
        if (rawOpps.length > 0) {
            generatePipelineReport(rawOpps);
        }
    };

    if (loading) return <DashboardSkeleton />;

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 pb-20">
            {/* Enterprise Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-primary-500/20">
                            Frecuencia Enterprise
                        </span>
                        <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/5 px-4 py-1.5 rounded-full border border-emerald-500/20 shadow-sm">
                            <ShieldCheck size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Nodos Verificados</span>
                        </div>
                        <AnimatePresence>
                            {isCached && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-1.5 text-amber-500 bg-amber-500/5 px-4 py-1.5 rounded-full border border-amber-500/20"
                                >
                                    <Sparkles size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Optimización de Caché</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9] flex flex-wrap gap-x-4">
                        Intelligence
                        <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">Nexus</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mt-6 max-w-2xl text-lg lg:text-xl leading-relaxed">
                        Consola de mando ejecutiva. Análisis predictivo de ingresos y supervisión atómica de la red comercial.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    {/* Period Switcher */}
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-1">
                        <button
                            onClick={() => setPeriod('monthly')}
                            className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${period === 'monthly'
                                ? 'bg-primary-600 text-white shadow-xl shadow-primary-600/20'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                        >
                            Mensual
                        </button>
                        <button
                            onClick={() => setPeriod('yearly')}
                            className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${period === 'yearly'
                                ? 'bg-primary-600 text-white shadow-xl shadow-primary-600/20'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                        >
                            Anual
                        </button>
                    </div>

                    <button
                        onClick={handleExportReport}
                        className="flex items-center gap-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-8 h-16 rounded-[2rem] font-black hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow"
                    >
                        <Download size={20} />
                        <span className="hidden sm:inline">Exportar Auditoría</span>
                    </button>
                    <button
                        onClick={() => refetch()}
                        disabled={isRefreshing}
                        className="flex items-center gap-3 bg-primary-600 text-white px-8 h-16 rounded-[2rem] font-black hover:bg-primary-700 transition-all shadow-2xl shadow-primary-600/40 disabled:opacity-50 group"
                    >
                        {isRefreshing ? <RefreshCw size={20} className="animate-spin" /> : <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />}
                        <span>{isRefreshing ? 'Sincronizando...' : 'Recalcular'}</span>
                    </button>
                </div>
            </div>

            {/* AI Insights Banner */}
            <AIBanner forecast={forecast} monthsAnalyzed={stats.chartData?.length || 0} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard
                    title={period === 'monthly' ? "Ingresos (Mes)" : "Ingresos (Año)"}
                    value={`${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(stats.totalSales)}`}
                    icon={<TrendingUp size={24} />}
                    trend="+14.2%"
                    color="primary"
                />

                <StatCard
                    title="Propuestas Activas"
                    value={stats.activeOpportunities.toString()}
                    icon={<Briefcase size={24} />}
                    trend="+6 hoy"
                    color="amber"
                />
                <StatCard
                    title="Índice de Cierre"
                    value={`${stats.winRate.toFixed(1)}%`}
                    icon={<Trophy size={24} />}
                    trend="Excelente"
                    color="emerald"
                />
                <StatCard
                    title="Protocolos Pendientes"
                    value={stats.pendingTasks.toString()}
                    icon={<CheckSquare size={24} />}
                    trend="Atención"
                    color="indigo"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2">
                    <div className="h-full min-h-[500px]">
                        <SalesChart data={stats.chartData} />
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <ExecutiveBriefing />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1">
                    <RecentActivity activities={stats.recentActivity} />
                </div>
                <div className="lg:col-span-2">
                    {/* Performance Section integrated below or here */}
                    <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm h-full">
                        <div className="flex items-center gap-4 mb-8">
                            <TrendingUp size={24} className="text-emerald-500" />
                            <h4 className="text-xl font-black tracking-tight">Ventas por Representante</h4>
                        </div>
                        <div className="space-y-6">
                            {stats.repPerformance.slice(0, 3).map((rep) => (
                                <div key={rep.id} className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span>{rep.name}</span>
                                        <span>{rep.total_sales.toLocaleString()}€</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(rep.total_sales / 50000) * 100}%` }}
                                            className="h-full bg-primary-600 rounded-full"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Performance Section */}
            <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-12 border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6">
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-4">
                            <Target size={32} className="text-primary-500" />
                            Rendimiento Operativo
                        </h3>
                        <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-[0.25em]">Métricas de impacto por unidad de cuenta</p>
                    </div>
                    <button className="text-[10px] font-black text-primary-500 uppercase tracking-widest hover:bg-primary-50 px-6 py-3 rounded-2xl border border-primary-500/10 transition-all">Protocolo de Auditoría</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {stats.repPerformance?.length > 0 ? (
                        stats.repPerformance.map((rep, idx) => (
                            <div key={rep.id} className="relative group p-6 rounded-[2.5rem] hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-all even:bg-slate-50/30 dark:even:bg-slate-900/10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-white dark:bg-slate-800 flex items-center justify-center font-black text-2xl text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700 shadow-sm group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-all duration-300">
                                            {rep.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">{rep.name}</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{rep.deals_won} cierres estratégicos</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-slate-900 dark:text-white text-lg tracking-tighter tabular-nums">{rep.total_sales.toLocaleString()} €</p>
                                        <div className="flex items-center justify-end gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">
                                            <TrendingUp size={12} />
                                            Nodo {idx + 1}
                                        </div>
                                    </div>
                                </div>
                                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (rep.total_sales / 50000) * 100)}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut", delay: idx * 0.2 }}
                                        className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full"
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-3 py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
                            <BrainCircuit size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-6" />
                            <p className="text-slate-400 dark:text-slate-500 font-black uppercase text-xs tracking-[0.2em]">Sincronizando rendimiento de red comercial...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
