import React, { useState, useEffect, useCallback, memo } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import {
    MoreVertical,
    Plus,
    Target,
    Check,
    X,
    Search,
    Briefcase,
    TrendingUp,
    ShieldCheck,
    Zap
} from 'lucide-react';
import { getOpportunityScore } from '../../services/ai';
import { useOpportunities } from '../../hooks/useOpportunities';
import { useOpportunitySummary } from '../../hooks/useOpportunitySummary';
import { useClients } from '../../hooks/useClients';
import { usePermissions } from '../../hooks/usePermissions';
import type { Opportunity } from '../../types';
import { sanitizePayload } from '../../utils/sanitize';
import Modal from '../Common/Modal';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { Select } from '../UI/Select';
import { toast } from 'sonner';
import { formatMoney } from '../../utils/format';

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
        <div
            className="bg-surface-card p-4 rounded-lg border border-surface-border shadow-sm hover:border-primary-500/50 transition-all cursor-grab active:cursor-grabbing group"
        >
            <div className="flex flex-col gap-2 mb-3">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-surface-muted uppercase tracking-wider">{opp.client_company}</span>
                    {opp.status === 'pendiente' && scores[opp.id] && (
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-success-text bg-success-bg px-1.5 py-0.5 rounded border border-success-border">
                            <TrendingUp size={10} />
                            {scores[opp.id].score}%
                        </div>
                    )}
                </div>
                <h4 className="font-semibold text-surface-text text-sm leading-snug group-hover:text-primary-600 transition-colors uppercase tracking-tight">{opp.product}</h4>
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-surface-muted-bg rounded flex items-center justify-center text-[10px] font-bold text-surface-muted border border-surface-border">
                        {opp.client_name?.charAt(0)}
                    </div>
                    <p className="text-[11px] text-surface-muted">{opp.client_name}</p>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-surface-border">
                <div className="text-sm font-bold text-surface-text tabular-nums">
                    {formatMoney(Number(opp.amount), { maximumFractionDigits: 0 })}
                </div>

                <div className="flex items-center gap-1">
                    {canEditOpportunity && opp.status === 'pendiente' && (
                        <>
                            <button
                                onClick={() => onUpdateStatus(opp.id, 'ganado')}
                                className="p-1.5 text-surface-muted hover:text-success-icon hover:bg-success-bg rounded transition-colors"
                                title="Marcar como ganado"
                            >
                                <Check size={14} />
                            </button>
                            <button
                                onClick={() => onUpdateStatus(opp.id, 'perdido')}
                                className="p-1.5 text-surface-muted hover:text-danger-icon hover:bg-danger-bg rounded transition-colors"
                                title="Marcar como perdido"
                            >
                                <X size={14} />
                            </button>
                        </>
                    )}
                    {canEditOpportunity && opp.status !== 'pendiente' && (
                        <button
                            onClick={() => onUpdateStatus(opp.id, 'pendiente')}
                            className="text-[10px] font-bold text-surface-muted hover:text-primary-600 transition-colors uppercase"
                        >
                            Reabrir
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

OpportunityCard.displayName = 'OpportunityCard';

const PipelineView = () => {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { opportunities, loading: oppsLoading, pagination, loadMore, isLoadingMore, createOpportunity, updateOpportunityStatus } = useOpportunities(50, debouncedSearch);
    const { data: summaryData } = useOpportunitySummary(debouncedSearch);
    const { clients, loading: clientsLoading } = useClients(100);
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

    const allOpportunities = Array.isArray(opportunities) ? opportunities : [];

    const filteredOpportunities = allOpportunities.filter(opp => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'high-value') return Number(opp.amount) >= 10000;
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
    const totalMatches = summaryData?.total ?? pagination.total ?? safeOpportunities.length;
    const summaryByStatus = summaryData?.byStatus ?? { pendiente: 0, ganado: 0, perdido: 0 };

    useEffect(() => {
        const fetchScores = async () => {
            const newScores: Record<number, { score: number; classification: string }> = { ...scores };
            let hasChanges = false;

            const pendingOpps = safeOpportunities.filter(opp => opp.status === 'pendiente' && !newScores[opp.id]).slice(0, 3);

            for (const opp of pendingOpps) {
                try {
                    const data = await getOpportunityScore(opp.id);
                    newScores[opp.id] = data;
                    hasChanges = true;
                } catch (e) {
                    console.error('Failed to get score for', opp.id, e);
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
            toast.error('No se pudo actualizar el estado de la oportunidad.');
        }
    }, [updateOpportunityStatus]);

    const handleDragEnd = useCallback((result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (destination.droppableId === source.droppableId) {
            return;
        }

        const match = /^opp-(\d+)$/.exec(draggableId);
        const opportunityId = match ? Number(match[1]) : NaN;
        if (!Number.isFinite(opportunityId)) return;

        if (destination.droppableId !== 'pendiente' && destination.droppableId !== 'ganado' && destination.droppableId !== 'perdido') {
            return;
        }

        const newStatus = destination.droppableId;

        handleUpdateStatus(opportunityId, newStatus);
    }, [handleUpdateStatus]);

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
        } catch (error: unknown) {
            console.error(error);
            toast.error('No se pudo crear la oportunidad. Inténtalo de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const columnConfig = [
        { id: 'pendiente' as const, title: 'Pendiente', color: 'bg-primary-500' },
        { id: 'ganado' as const, title: 'Ganado', color: 'bg-success-icon' },
        { id: 'perdido' as const, title: 'Perdido', color: 'bg-surface-muted' }
    ];

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-140px)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-surface-text">Pipeline de ventas</h1>
                    <p className="text-sm text-surface-muted mt-1 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-success-icon" />
                        Seguimiento y previsión de oportunidades con IA.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center bg-surface-muted-bg p-1 rounded-lg border border-surface-border">
                        {[
                            { id: 'all', label: 'Todas', icon: Briefcase },
                            { id: 'high-value', label: 'Alto valor', icon: TrendingUp },
                            { id: 'high-score', label: 'Alta prob.', icon: Target },
                            { id: 'stagnant', label: 'Estancadas', icon: Zap }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setActiveFilter(f.id as typeof activeFilter)}
                                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 ${activeFilter === f.id
                                    ? 'bg-surface-card text-surface-text shadow-sm border border-surface-border' : 'text-surface-muted hover:text-surface-text'}`}
                            >
                                <f.icon size={12} />
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative group w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted group-focus-within:text-primary-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar oportunidades..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-surface-input border border-surface-border rounded-lg text-sm text-surface-text placeholder:text-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                        />
                    </div>
                    {canCreateOpportunity && (
                        <Button
                            variant="primary"
                            size="md"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <Plus size={18} className="mr-2" />
                            Nueva oportunidad
                        </Button>
                    )}
                </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex gap-4 overflow-x-auto pb-4 h-full">
                    {columnConfig.map(column => (
                        <div key={column.id} className="flex-1 min-w-[300px] flex flex-col gap-3">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${column.color}`}></div>
                                    <h3 className="font-bold text-surface-muted uppercase text-[10px] tracking-wider">{column.title}</h3>
                                    <Badge variant="secondary">
                                        {summaryByStatus[column.id]}
                                    </Badge>
                                </div>
                                <button className="text-surface-muted hover:text-surface-text transition-colors">
                                    <MoreVertical size={16} />
                                </button>
                            </div>

                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => {
                                    const columnOpps = safeOpportunities.filter(o => o.status === column.id);

                                    if (loading) {
                                        return (
                                            <div className="space-y-3 p-3 bg-surface-muted-bg/30 border border-surface-border rounded-lg flex-1">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="h-24 bg-surface-card rounded-lg border border-surface-border animate-pulse"></div>
                                                ))}
                                            </div>
                                        );
                                    }

                                    if (columnOpps.length === 0) {
                                        return (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`flex-1 flex flex-col items-center justify-center text-surface-muted border border-dashed border-surface-border rounded-lg bg-surface-card/50 h-32 ${snapshot.isDraggingOver ? 'bg-surface-hover' : ''}`}
                                            >
                                                <Target size={24} className="mb-2 opacity-20" />
                                                <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Sin oportunidades</p>
                                                {provided.placeholder}
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex-1 overflow-y-auto custom-scrollbar p-3 rounded-lg border transition-colors min-h-[400px] ${snapshot.isDraggingOver ? 'bg-surface-hover border-primary-500/30' : 'bg-surface-muted-bg/30 border-surface-border'}`}
                                        >
                                            {columnOpps.map((opp, index) => (
                                                <Draggable
                                                    key={opp.id}
                                                    draggableId={`opp-${opp.id}`}
                                                    index={index}
                                                    isDragDisabled={!canCreateOpportunity}
                                                >
                                                    {(draggableProvided, draggableSnapshot) => (
                                                        <div
                                                            ref={draggableProvided.innerRef}
                                                            {...draggableProvided.draggableProps}
                                                            {...draggableProvided.dragHandleProps}
                                                            style={{
                                                                ...draggableProvided.draggableProps.style,
                                                                opacity: draggableSnapshot.isDragging ? 0.8 : 1
                                                            }}
                                                            className="mb-3"
                                                        >
                                                            <OpportunityCard
                                                                opp={opp}
                                                                scores={scores}
                                                                canEditOpportunity={canCreateOpportunity}
                                                                onUpdateStatus={handleUpdateStatus}
                                                            />
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    );
                                }}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-surface-muted">
                    Mostrando {safeOpportunities.length} de {totalMatches}
                </div>
                {pagination.hasMore && (
                    <Button variant="outline" size="sm" onClick={() => loadMore()} isLoading={isLoadingMore}>
                        Cargar más
                    </Button>
                )}
            </div>

            {/* Creation Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nueva oportunidad"
                maxWidth="max-w-xl"
            >
                <form onSubmit={handleCreateOpportunity} className="space-y-4">
                    <Select
                        label="Cliente"
                        required
                        name="clientId"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                    >
                        <option value="">Selecciona un cliente...</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </Select>

                    <Input
                        label="Producto / Solución"
                        type="text"
                        required
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
                        placeholder="Ej: Solución enterprise"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Importe (€)"
                            type="number"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                        />
                        <Select
                            label="Estado"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as 'pendiente' | 'ganado' | 'perdido')}
                        >
                            <option value="pendiente">Pendiente</option>
                            <option value="ganado">Ganado</option>
                            <option value="perdido">Perdido</option>
                        </Select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            isLoading={isSubmitting}
                        >
                            Crear oportunidad
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PipelineView;
