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
    ChevronRight
} from 'lucide-react';
import { useOpportunities } from '../../hooks/useOpportunities';
import { useClients } from '../../hooks/useClients';
import { usePermissions } from '../../hooks/usePermissions';
import type { Opportunity } from '../../types';
import { sanitizePayload } from '../../utils/sanitize';
import { SkeletonTable } from '../Common/Skeletons';
import Modal from '../Common/Modal';
import { useFPSMonitor } from '../../hooks/useFPSMonitor';

const OpportunityCard = memo(({
    opp,
    scores,
    canEditOpportunity,
    onUpdateStatus
}: {
    opp: Opportunity,
    scores: Record<number, { winProbability: number; leadScore: number }>,
    canEditOpportunity: boolean,
    onUpdateStatus: (id: number, status: 'pendiente' | 'ganado' | 'perdido') => void
}) => {
    return (
        <motion.div
            layoutId={opp.id.toString()}
            whileHover={{ scale: 1.02, y: -4 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow hover:shadow-xl transition-all cursor-grab active:cursor-grabbing group"
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
                    <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-black">
                        {opp.client_name?.charAt(0)}
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{opp.client_name}</p>
                </div>
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-slate-50 dark:border-slate-800/50">
                <div className="flex flex-col">
                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums gap-2 flex items-center">
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(opp.amount)}
                        {opp.status === 'pendiente' && scores[opp.id] && (
                            <div className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] tracking-widest font-black flex items-center gap-1 border border-indigo-100 dark:border-indigo-800" title="Win Probability / Lead Score">
                                <Target size={10} />
                                {scores[opp.id].winProbability}%
                                <span className="opacity-50 mx-1">|</span>
                                S:{scores[opp.id].leadScore}
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
                            className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl hover:text-primary-500 transition-all"
                            title="Reabrir Oportunidad"
                        >
                            <ArrowRight size={16} className="rotate-180" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
});

OpportunityCard.displayName = 'OpportunityCard';

const PipelineView = () => {
    const { opportunities, loading: oppsLoading, pagination, loadOpportunities, createOpportunity, updateOpportunityStatus } = useOpportunities();
    const { clients, loading: clientsLoading, loadClients } = useClients();
    const { canCreateOpportunity } = usePermissions();
    const loading = oppsLoading || clientsLoading;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');

    // Form state
    const [clientId, setClientId] = useState('');
    const [product, setProduct] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState<'pendiente' | 'ganado' | 'perdido'>('pendiente');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [scores, setScores] = useState<Record<number, { winProbability: number; leadScore: number }>>({});

    useFPSMonitor('PipelineView', 40);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadOpportunities(1, 15, search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, loadOpportunities]);

    useEffect(() => {
        loadClients(1, 100); // Load all clients for the select
    }, [loadClients]);

    const safeOpportunities = Array.isArray(opportunities) ? opportunities : [];

    useEffect(() => {
        const fetchScores = async () => {
            const newScores: Record<number, { winProbability: number; leadScore: number }> = { ...scores };
            let hasChanges = false;

            for (const opp of safeOpportunities) {
                if (opp.status === 'pendiente' && !newScores[opp.id]) {
                    try {
                        const { api } = await import('../../services/api');
                        const data = await api.ai.getScore(opp.id);
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
                        <Columns size={18} className="text-primary-500" />
                        Flujo de ingresos proyectados en tiempo real
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative w-64 h-14 group">
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
                            className="flex items-center gap-3 bg-indigo-600 text-white px-8 h-14 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30 group"
                        >
                            <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                            <span>Inyectar Oportunidad</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex gap-8 overflow-x-auto pb-6 -mx-4 px-4 h-full scrollbar-hide">
                {columns.map(column => (
                    <div key={column.id} className="flex-1 min-w-[350px] flex flex-col gap-6">
                        <div className="flex items-center justify-between px-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-4 h-4 rounded-full ${column.color} ${column.shadow} animate-pulse`}></div>
                                <h3 className="font-black text-slate-700 dark:text-slate-300 uppercase text-xs tracking-[0.2em]">{column.title}</h3>
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black px-3 py-1 rounded-full border border-slate-200/50 dark:border-slate-700/50">
                                    {safeOpportunities.filter(o => o.status === column.id).length}
                                </span>
                            </div>
                            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                <MoreVertical size={20} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 min-h-[400px] flex-1 overflow-y-auto scrollbar-hide">
                            {loading ? (
                                <div className="max-w-[1600px] mx-auto pb-20 fade-in">
                                    <SkeletonTable />
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
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-800 border-2 border-dashed border-slate-100 dark:border-slate-800/50 rounded-[2rem]">
                                    <Target size={40} className="mb-4 opacity-50" />
                                    <p className="text-xs font-black uppercase tracking-widest">Zona Vacía</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    Página <span className="text-slate-900 dark:text-white">{pagination.page}</span> de <span className="text-slate-900 dark:text-white">{pagination.totalPages || 1}</span>
                    <span className="mx-2 opacity-20">|</span>
                    Total: <span className="text-slate-900 dark:text-white">{pagination.total}</span> oportunidades
                </p>
                <div className="flex items-center gap-2">
                    <button
                        disabled={pagination.page === 1}
                        onClick={() => loadOpportunities(pagination.page - 1, pagination.limit, search)}
                        className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 disabled:opacity-30 transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0}
                        onClick={() => loadOpportunities(pagination.page + 1, pagination.limit, search)}
                        className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 disabled:opacity-30 transition-all"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Creation Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Oportunidad de Negocio">
                <form onSubmit={handleCreateOpportunity} className="space-y-6">
                    <div>
                        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Cliente Objetivo</label>
                        <select
                            required
                            name="clientId"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold dark:text-white"
                        >
                            <option value="">Selecciona un socio comercial...</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Solución Sugerida</label>
                        <input
                            type="text"
                            required
                            name="product"
                            value={product}
                            onChange={(e) => setProduct(e.target.value)}
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold placeholder:text-slate-400 dark:text-white"
                            placeholder="Ej: Infraestructura Cloud Escalable"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Volumen Proyectado (€)</label>
                            <input
                                type="number"
                                required
                                name="amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold dark:text-white"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Estado del Lead</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as 'pendiente' | 'ganado' | 'perdido')}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold dark:text-white"
                            >
                                <option value="pendiente">Iniciado / Pendiente</option>
                                <option value="ganado">Cerrado Ganado (MVP)</option>
                                <option value="perdido">Cerrado Perdido</option>
                            </select>
                        </div>
                    </div>
                    <button
                        disabled={isSubmitting || clients.length === 0}
                        type="submit"
                        className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-2xl shadow-indigo-600/40 hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-[0.98]"
                    >
                        {isSubmitting ? 'Inyectando Lead...' : 'Sembrar Oportunidad'}
                    </button>
                    {clients.length === 0 && (
                        <p className="text-xs text-rose-500 text-center font-black uppercase tracking-widest">Error crítico: No hay socios en la red.</p>
                    )}
                </form>
            </Modal>
        </div>
    );
};

export default PipelineView;
