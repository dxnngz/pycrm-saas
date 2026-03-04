import { useState, useEffect } from 'react';
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
    <div className="max-w-[1600px] mx-auto space-y-10 animate-pulse">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-4">
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                <div className="h-16 w-96 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
                <div className="h-4 w-128 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
            </div>
            <div className="flex gap-4">
                <div className="h-16 w-48 bg-slate-200 dark:bg-slate-800 rounded-[2rem]"></div>
                <div className="h-16 w-40 bg-slate-200 dark:bg-slate-800 rounded-[2rem]"></div>
            </div>
        </div>
        <div className="h-32 w-full bg-slate-200 dark:bg-slate-800 rounded-[3rem]"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-40 bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]"></div>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 h-[450px] bg-slate-200 dark:bg-slate-800 rounded-[3.5rem]"></div>
            <div className="lg:col-span-1 h-[450px] bg-slate-200 dark:bg-slate-800 rounded-[3.5rem]"></div>
        </div>
    </div>
);

const DashboardView = () => {
    const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
    const [stats, setStats] = useState<DashboardStats>({
        totalSales: 0,
        activeOpportunities: 0,
        completedTasks: 0,
        pendingTasks: 0,
        recentActivity: [],
        winRate: 0,
        repPerformance: [],
        chartData: []
    });
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [forecast, setForecast] = useState<{ value: number, growth: number } | null>(null);
    const [rawOpps, setRawOpps] = useState<Opportunity[]>([]);
    const [isCached, setIsCached] = useState(false);

    useEffect(() => {
        loadDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period]);

    useEffect(() => {
        const handleMetricsUpdate = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail.period === period) {
                const refreshedMetrics = customEvent.detail.data;
                setStats(prev => ({
                    ...prev,
                    totalSales: refreshedMetrics.totalSales || 0,
                    winRate: refreshedMetrics.conversionRate || 0,
                    repPerformance: refreshedMetrics.repPerformance || [],
                    chartData: refreshedMetrics.chartData || []
                }));
                setIsCached(false);
            }
        };

        window.addEventListener('dashboard_metrics_updated', handleMetricsUpdate);
        return () => window.removeEventListener('dashboard_metrics_updated', handleMetricsUpdate);
    }, [period]);

    const loadDashboardData = async (manual = false) => {
        if (manual) setIsRefreshing(true);
        else setLoading(true);

        try {
            const [oppsResponse, tasks, backendMetrics] = await Promise.all([
                api.opportunities.getAll(1, 100),
                api.tasks.getAll(),
                api.dashboard.getMetrics(period)
            ]);

            const opps = Array.isArray(oppsResponse?.data) ? oppsResponse.data : [];
            setRawOpps(opps);
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

            setStats({
                totalSales: backendMetrics?.totalSales || 0,
                activeOpportunities: opps.filter(o => o.status === 'pendiente').length,
                completedTasks,
                pendingTasks,
                recentActivity,
                winRate: backendMetrics?.conversionRate || 0,
                repPerformance: backendMetrics?.repPerformance || [],
                chartData: backendMetrics?.chartData || []
            });

            setIsCached(!!backendMetrics?._cached);

            const prediction = await predictFutureSales(opps.map(o => ({
                amount: o.amount,
                date: o.created_at || new Date().toISOString()
            })));
            setForecast(prediction);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

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
                        onClick={() => loadDashboardData(true)}
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
                    <RecentActivity activities={stats.recentActivity} />
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
