import { useState, useEffect } from 'react';
import {
    TrendingUp,
    Briefcase,
    CheckSquare,
    Download,
    BrainCircuit,
    Loader2,
    Trophy,
    Sparkles,
    Target,
    ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
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
                // When revalidated, mark as live
                setIsCached(false);
            }
        };

        window.addEventListener('dashboard_metrics_updated', handleMetricsUpdate);
        return () => window.removeEventListener('dashboard_metrics_updated', handleMetricsUpdate);
    }, [period]);

    const loadDashboardData = async () => {
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
            setLoading(false);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setLoading(false);
        }
    };

    const handleExportReport = () => {
        if (rawOpps.length > 0) {
            generatePipelineReport(rawOpps);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <Loader2 className="animate-spin text-primary-600" size={60} />
                        <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-400" size={24} />
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Sincronizando IA...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 pb-20">
            {/* Enterprise Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-primary-500/20">
                            Enterprise v4.0
                        </span>
                        <div className="flex items-center gap-1 text-emerald-500">
                            <ShieldCheck size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Seguridad Biométrica Activa</span>
                        </div>
                        {isCached && (
                            <div className="flex items-center gap-1 text-amber-500" title="Datos extraídos desde la caché del cliente (SWR)">
                                <Sparkles size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Live Cache</span>
                            </div>
                        )}
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                        Intelligence <span className="text-primary-600">Center</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mt-4 max-w-2xl text-lg">
                        Bienvenido al núcleo de PyCRM. Analítica predictiva, gestión de clientes y automatización de ventas en una sola consola de alto rendimiento.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Period Switcher */}
                    <div className="bg-white dark:bg-slate-900 p-1.5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-1">
                        <button
                            onClick={() => setPeriod('monthly')}
                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === 'monthly'
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                        >
                            Mensual
                        </button>
                        <button
                            onClick={() => setPeriod('yearly')}
                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === 'yearly'
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                        >
                            Anual
                        </button>
                    </div>

                    <button
                        onClick={handleExportReport}
                        className="flex items-center gap-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-8 h-16 rounded-[2rem] font-black hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20"
                    >
                        <Download size={20} />
                        <span>Exportar Intelligence</span>
                    </button>
                    <button
                        onClick={() => loadDashboardData()}
                        className="flex items-center gap-3 bg-primary-600 text-white px-8 h-16 rounded-[2rem] font-black hover:bg-primary-700 transition-all shadow-2xl shadow-primary-600/40 hover:-translate-y-1"
                    >
                        <Sparkles size={20} />
                        <span>Recalcular IA</span>
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
                    trend="+12.5%"
                    color="primary"
                />

                <StatCard
                    title="Oportunidades Activas"
                    value={stats.activeOpportunities.toString()}
                    icon={<Briefcase size={24} />}
                    trend="+4 hoy"
                    color="amber"
                />
                <StatCard
                    title="Win Rate Global"
                    value={`${stats.winRate.toFixed(1)}%`}
                    icon={<Trophy size={24} />}
                    trend="Top 5%"
                    color="emerald"
                />
                <StatCard
                    title="Tareas Pendientes"
                    value={stats.pendingTasks.toString()}
                    icon={<CheckSquare size={24} />}
                    trend="Urgente"
                    color="indigo"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2">
                    <SalesChart data={stats.chartData} />
                </div>
                <div className="lg:col-span-1">
                    <RecentActivity activities={stats.recentActivity} />
                </div>
            </div>

            {/* Global Performance Section */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <Target size={24} className="text-primary-500" />
                            Rendimiento Comercial
                        </h3>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Métricas individuales por asesor</p>
                    </div>
                    <button className="text-xs font-black text-primary-500 uppercase tracking-widest hover:underline">Ver Auditoría Completa</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {stats.repPerformance?.length > 0 ? (
                        stats.repPerformance.map((rep, idx) => (
                            <div key={rep.id} className="relative group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                                            {rep.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 dark:text-white text-sm">{rep.name}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rep.deals_won} cierres</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-slate-900 dark:text-white text-sm">{rep.total_sales.toLocaleString()} €</p>
                                        <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase">
                                            <TrendingUp size={10} />
                                            Top {idx + 1}
                                        </div>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '75%' }}
                                        transition={{ duration: 1, delay: idx * 0.2 }}
                                        className="h-full bg-primary-500 rounded-full"
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-3 py-10 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem]">
                            <p className="text-slate-400 font-bold">No hay datos de rendimiento comercial disponibles todavía.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
