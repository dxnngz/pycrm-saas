import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import {
    MoreVertical,
    Plus,
    Columns,
    Target,
    ArrowRight,
    Check,
    X,
    Search,
    ChevronLeft,
    ChevronRight,
    Briefcase,
    TrendingUp,
    ShieldCheck,
    Zap
} from 'lucide-react';
import { useOpportunities } from '../../hooks/useOpportunities';
import { useClients } from '../../hooks/useClients';
import { usePermissions } from '../../hooks/usePermissions';
import type { Opportunity } from '../../types';
import { sanitizePayload } from '../../utils/sanitize';
import Modal from '../Common/Modal';
import { useFPSMonitor } from '../../hooks/useFPSMonitor';
import { Input } from '../Common/Input';

const OpportunityCard = memo(({
    opp,
    scores,
    canEditOpportunity,
    onUpdateStatus
}: {
    opp: Opportunity,
    scores: Record<number, { score: number; classification: string }>,
    canEditOpportunity: boolean,
    onUpdateStatus: (id: number, status: 'pendiente' | 'ganado' | 'perdido') => void
}) => {
    return (
        <motion.div
            layoutId={opp.id.toString()}
            whileHover={{ scale: 1.02, y: -4 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow hover:shadow-xl transition-all cursor-grab active:cursor-grabbing group border-l-4 border-l-primary-500/20"
        >
            <div className="flex flex-col gap-1 mb-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest">{opp.client_company}</p>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight size={14} className="text-slate-400" />
                    </div>
                </div>
                <h4 className="font-black text-slate-900 dark:text-white text-lg leading-tight group-hover:text-primary-500 transition-colors uppercase tracking-tighter">{opp.product}</h4>
                <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500">
                        {opp.client_name?.charAt(0)}
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{opp.client_name}</p>
                </div>
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-slate-50 dark:border-slate-800/50">
                <div className="flex flex-col">
                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums gap-2 flex flex-col items-start">
                        <span className="flex items-center gap-1">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(opp.amount)}
                        </span>
                        {opp.status === 'pendiente' && scores[opp.id] && (
                            <div className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] tracking-widest font-black flex items-center gap-1 border border-emerald-500/20" title="AI Lead Score / Classification">
                                <TrendingUp size={10} />
                                {scores[opp.id].score}%
                                <span className="opacity-30 mx-1">|</span>
                                {scores[opp.id].classification}
                            </div>
                        )}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {canEditOpportunity && opp.status === 'pendiente' && (
                        <>
                            <button
                                onClick={() => onUpdateStatus(opp.id, 'ganado')}
                                className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                title="Cerrar como Ganado"
                            >
                                <Check size={16} />
                            </button>
                            <button
                                onClick={() => onUpdateStatus(opp.id, 'perdido')}
                                className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                title="Cerrar como Perdido"
                            >
                                <X size={16} />
                            </button>
                        </>
                    )}
                    {canEditOpportunity && opp.status !== 'pendiente' && (
                        <button
                            onClick={() => onUpdateStatus(opp.id, 'pendiente')}
                            className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl hover:text-primary-500 transition-all font-black text-[10px] flex items-center gap-1 uppercase tracking-widest px-3"
                            title="Reabrir Oportunidad"
                        >
                            <ArrowRight size={14} className="rotate-180" />
                            Reabrir
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
});

OpportunityCard.displayName = 'OpportunityCard';

const PipelineView = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { opportunities, loading: oppsLoading, pagination, loadOpportunities, createOpportunity, updateOpportunityStatus } = useOpportunities(page, 15, debouncedSearch);
    const { clients, loading: clientsLoading } = useClients(1, 100);
    const { canCreateOpportunity } = usePermissions();
    const loading = oppsLoading || clientsLoading;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'high-value' | 'high-score' | 'stagnant'>('all');

    // Form state
    const [clientId, setClientId] = useState('');
    const [product, setProduct] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState<'pendiente' | 'ganado' | 'perdido'>('pendiente');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [scores, setScores] = useState<Record<number, { score: number; classification: string }>>({});

    useFPSMonitor('PipelineView', 40);

    const allOpportunities = Array.isArray(opportunities) ? opportunities : [];

    const filteredOpportunities = allOpportunities.filter(opp => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'high-value') return opp.amount >= 10000;
        if (activeFilter === 'high-score') {
            const score = scores[opp.id];
            return score && (score.score >= 70 || score.classification === 'HIGH');
        }
        if (activeFilter === 'stagnant') {
            const createdDate = new Date(opp.created_at || new Date());
            const daysDiff = (new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
            return daysDiff > 30 && opp.status === 'pendiente';
        }
        return true;
    });

    const safeOpportunities = filteredOpportunities;

    useEffect(() => {
        const fetchScores = async () => {
            const newScores: Record<number, { score: number; classification: string }> = { ...scores };
            let hasChanges = false;

            for (const opp of safeOpportunities) {
                if (opp.status === 'pendiente' && !newScores[opp.id]) {
                    try {
                        const { api } = await import('../../services/api');
                        const data = await api.ai.getLeadScore(opp.id);
                        newScores[opp.id] = data;
                        hasChanges = true;
                    } catch (e) {
                        console.error('Failed to get score for', opp.id, e);
                    }
                }
            }
            if (hasChanges) {
                setScores(newScores);
            }
        };

        if (safeOpportunities.length > 0) {
            fetchScores();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opportunities]);

    const handleUpdateStatus = useCallback(async (id: number, newStatus: 'pendiente' | 'ganado' | 'perdido') => {
        try {
            await updateOpportunityStatus(id, newStatus);
        } catch (error: unknown) {
            console.error(error);
        }
    }, [updateOpportunityStatus]);

    const handleCreateOpportunity = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const oppData = sanitizePayload({
                client_id: parseInt(clientId),
                product,
                amount: parseFloat(amount),
                status
            });
            await createOpportunity(oppData);
            setIsModalOpen(false);
            setClientId('');
            setProduct('');
            setAmount('');
            setStatus('pendiente');
            loadOpportunities(pagination.page, pagination.limit, search);
        } catch (error: unknown) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns = [
        { id: 'pendiente' as const, title: 'Pipeline / Propuesta', color: 'bg-indigo-500', shadow: 'shadow-indigo-500/20' },
        { id: 'ganado' as const, title: 'Cerrado / Ganado', color: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' },
        { id: 'perdido' as const, title: 'Cerrado / Perdido', color: 'bg-slate-500', shadow: 'shadow-slate-500/20' }
    ];

    return (
        <div className="flex flex-col gap-10 h-[calc(100vh-180px)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Pipeline Estratégico</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 flex items-center gap-2">
                        <ShieldCheck size={18} className="text-emerald-500" />
                        Flujo de ingresos verificado por IA
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 mr-4">
                        {[
                            { id: 'all', label: 'Todos', icon: Briefcase },
                            { id: 'high-value', label: 'Alto Valor', icon: TrendingUp },
                            { id: 'high-score', label: 'Alta Prob.', icon: Target },
                            { id: 'stagnant', label: 'Estancados', icon: Zap }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setActiveFilter(f.id as typeof activeFilter)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${activeFilter === f.id
                                    ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-100 dark:border-primary-500/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border-transparent'}`}
                            >
                                <f.icon size={14} />
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative flex-1 sm:w-64 h-14 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar oportunidad..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-full pl-14 pr-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold shadow-sm"
                        />
                    </div>
                    {canCreateOpportunity && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-3 bg-primary-600 text-white px-8 h-14 rounded-2xl font-black hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/30 group whitespace-nowrap"
                        >
                            <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                            <span>Inyectar Negocio</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex gap-8 overflow-x-auto pb-6 -mx-4 px-4 h-full scrollbar-hide">
                {columns.map(column => (
                    <div key={column.id} className="flex-1 min-w-[350px] flex flex-col gap-6">
                        <div className="flex items-center justify-between px-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${column.color} ${column.shadow} animate-pulse`}></div>
                                <h3 className="font-black text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-[0.25em]">{column.title}</h3>
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black px-3 py-1 rounded-full border border-slate-200/50 dark:border-slate-700/50">
                                    {safeOpportunities.filter(o => o.status === column.id).length}
                                </span>
                            </div>
                            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                <MoreVertical size={20} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-[3rem] border border-slate-100 dark:border-slate-800/50 min-h-[400px] flex-1 overflow-y-auto scrollbar-hide">
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-40 bg-white dark:bg-slate-800 rounded-[2.5rem] animate-pulse"></div>
                                    ))}
                                </div>
                            ) : safeOpportunities.filter(o => o.status === column.id).map((opp) => (
                                <OpportunityCard
                                    key={opp.id}
                                    opp={opp}
                                    scores={scores}
                                    canEditOpportunity={canCreateOpportunity}
                                    onUpdateStatus={handleUpdateStatus}
                                />
                            ))}
                            {!loading && safeOpportunities.filter(o => o.status === column.id).length === 0 && (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800/50 rounded-[3rem] transition-all bg-slate-50/20 dark:bg-slate-950/20">
                                    <Target size={40} className="mb-4 opacity-40 text-slate-300 dark:text-slate-600" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.15em] opacity-80">Sin Actividad Proyectada</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Creation Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Sincronizar Nueva Oportunidad"
                maxWidth="max-w-2xl"
            >
                <form onSubmit={handleCreateOpportunity} className="space-y-8">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Seleccionar Socio Comercial</label>
                        <div className="relative">
                            <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-primary-500" size={20} />
                            <select
                                required
                                name="clientId"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                className="w-full pl-14 pr-10 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl focus:ring-4 focus:ring-primary-500/10 outline-none font-bold dark:text-white appearance-none transition-all cursor-pointer hover:border-primary-500/30 text-sm"
                            >
                                <option value="">Enlazar con cliente existente...</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={20} />
                        </div>
                    </div>

                    <Input
                        label="Solución Sugerida"
                        type="text"
                        required
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
                        placeholder="Ej: Auditoría de Seguridad Enterprise"
                        icon={<Target size={18} />}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Input
                            label="Volumen Proyectado (€)"
                            type="number"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            icon={<TrendingUp size={18} />}
                        />
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Fase del Embudo</label>
                            <div className="relative">
                                <Columns className="absolute left-5 top-1/2 -translate-y-1/2 text-primary-500" size={20} />
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as 'pendiente' | 'ganado' | 'perdido')}
                                    className="w-full pl-14 pr-10 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl focus:ring-4 focus:ring-primary-500/10 outline-none font-bold dark:text-white appearance-none hover:border-primary-500/30 transition-all cursor-pointer text-sm"
                                >
                                    <option value="pendiente">Iniciado / En Proceso</option>
                                    <option value="ganado">Cerrado Exitoso</option>
                                    <option value="perdido">Cerrado Fallido</option>
                                </select>
                                <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            disabled={isSubmitting || clients.length === 0}
                            type="submit"
                            className="w-full py-6 bg-primary-600 text-white rounded-[2rem] font-black shadow-2xl shadow-primary-600/40 hover:bg-primary-700 transition-all disabled:opacity-50 active:scale-[0.98] uppercase tracking-[0.2em] text-xs"
                        >
                            {isSubmitting ? 'Sincronizando...' : 'Solidificar Acuerdo'}
                        </button>
                    </div>
                    {clients.length === 0 && (
                        <p className="text-[10px] text-rose-500 text-center font-black uppercase tracking-widest animate-bounce">Error Crítico: Socio no Detectado</p>
                    )}
                </form>
            </Modal>

            {/* Pagination Footer */}
            <div className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow gap-4">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    Página <span className="text-slate-900 dark:text-white">{pagination.page}</span> de <span className="text-slate-900 dark:text-white">{pagination.totalPages || 1}</span>
                    <span className="mx-2 opacity-20">|</span>
                    Total: <span className="text-slate-900 dark:text-white">{pagination.total}</span> oportunidades
                </p>
                <div className="flex items-center gap-2">
                    <button
                        disabled={pagination.page === 1}
                        onClick={() => loadOpportunities(pagination.page - 1, pagination.limit, search)}
                        className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 disabled:opacity-30 transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0}
                        onClick={() => loadOpportunities(pagination.page + 1, pagination.limit, search)}
                        className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 disabled:opacity-30 transition-all"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PipelineView;
