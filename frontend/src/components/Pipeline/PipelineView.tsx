import React, { useState, useEffect, useCallback, memo } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
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
    Zap,
    Pencil,
    Trash2
} from 'lucide-react';
import { getOpportunityScore } from '../../services/ai';
import { useOpportunities } from '../../hooks/useOpportunities';
import { useOpportunitySummary } from '../../hooks/useOpportunitySummary';
import { useClients } from '../../hooks/useClients';
import { usePermissions } from '../../hooks/usePermissions';
import { useTenantPlan } from '../../hooks/useTenantPlan';
import { useAuth } from '../../context/AuthContext';
import type { Opportunity, PipelineStageCategory } from '../../types';
import { sanitizePayload } from '../../utils/sanitize';
import Modal from '../Common/Modal';
import { ConfirmModal } from '../Common/ConfirmModal';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { Select } from '../UI/Select';
import { Dropdown } from '../UI/Dropdown';
import { toast } from 'sonner';
import { formatMoney } from '../../utils/format';

const OpportunityCard = memo(({
    opp,
    scores,
    canEditOpportunity,
    canDeleteOpportunity,
    onUpdateStatus,
    onEdit,
    onDelete,
    stageCategoryById,
    defaultOpenStageId,
    defaultWonStageId,
    defaultLostStageId
}: {
    opp: Opportunity,
    scores: Record<number, { score: number; classification: string }>,
    canEditOpportunity: boolean,
    canDeleteOpportunity: boolean,
    onUpdateStatus: (id: number, status: string) => void,
    onEdit: (opp: Opportunity) => void,
    onDelete: (id: number) => void,
    stageCategoryById: Record<string, PipelineStageCategory | undefined>,
    defaultOpenStageId: string,
    defaultWonStageId?: string,
    defaultLostStageId?: string
}) => {
    const category = stageCategoryById[opp.status];
    const isOpen = category === 'open';
    return (
        <div
            className="bg-surface-card p-4 rounded-lg border border-surface-border shadow-sm hover:border-primary-500/50 transition-all cursor-grab active:cursor-grabbing group"
        >
            <div className="flex flex-col gap-2 mb-3">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-surface-muted uppercase tracking-wider">{opp.client_company}</span>
                    {isOpen && scores[opp.id] && (
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
                    {canEditOpportunity && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onEdit(opp);
                            }}
                            className="p-1.5 text-surface-muted hover:text-primary-600 hover:bg-surface-hover rounded transition-colors"
                            title="Editar"
                        >
                            <Pencil size={14} />
                        </button>
                    )}
                    {canDeleteOpportunity && (
                        <Dropdown
                            trigger={(
                                <button
                                    type="button"
                                    className="p-1.5 text-surface-muted hover:text-danger-icon hover:bg-danger-bg rounded transition-colors"
                                    title="Eliminar"
                                    aria-label="Eliminar oportunidad"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                            options={[
                                {
                                    id: 'delete',
                                    label: 'Eliminar oportunidad',
                                    icon: <Trash2 size={14} />,
                                    variant: 'danger'
                                }
                            ]}
                            onSelect={() => onDelete(opp.id)}
                            align="right"
                        />
                    )}
                    {canEditOpportunity && isOpen && defaultWonStageId && defaultLostStageId && (
                        <>
                            <button
                                onClick={() => onUpdateStatus(opp.id, defaultWonStageId)}
                                className="p-1.5 text-surface-muted hover:text-success-icon hover:bg-success-bg rounded transition-colors"
                                title="Marcar como ganado"
                            >
                                <Check size={14} />
                            </button>
                            <button
                                onClick={() => onUpdateStatus(opp.id, defaultLostStageId)}
                                className="p-1.5 text-surface-muted hover:text-danger-icon hover:bg-danger-bg rounded transition-colors"
                                title="Marcar como perdido"
                            >
                                <X size={14} />
                            </button>
                        </>
                    )}
                    {canEditOpportunity && !isOpen && (
                        <button
                            onClick={() => onUpdateStatus(opp.id, defaultOpenStageId)}
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
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const { user } = useAuth();
    const [mineOnly, setMineOnly] = useState(false);
    const [overdueOnly, setOverdueOnly] = useState(false);
    const [amountMin, setAmountMin] = useState('');
    const [amountMax, setAmountMax] = useState('');
    const [focusStageId, setFocusStageId] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const filters = {
        assigned_to: mineOnly && user?.id ? user.id : undefined,
        amount_min: amountMin.trim() ? Number(amountMin) : undefined,
        amount_max: amountMax.trim() ? Number(amountMax) : undefined,
        overdue: overdueOnly ? true : undefined
    };

    const { opportunities, loading: oppsLoading, pagination, loadMore, isLoadingMore, createOpportunity, updateOpportunityStatus, updateOpportunity, deleteOpportunity } = useOpportunities(50, debouncedSearch, filters);
    const { data: summaryData } = useOpportunitySummary(debouncedSearch, filters);
    const { clients, loading: clientsLoading } = useClients(100);
    const { canCreateOpportunity, canDeleteOpportunity } = usePermissions();
    const { data: tenantPlan } = useTenantPlan();
    const loading = oppsLoading || clientsLoading;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLossModalOpen, setIsLossModalOpen] = useState(false);
    const [lossOppId, setLossOppId] = useState<number | null>(null);
    const [lossTargetStatus, setLossTargetStatus] = useState<string | null>(null);
    const [lossReason, setLossReason] = useState('');
    const [lossReasonDetail, setLossReasonDetail] = useState('');
    const [isLossSubmitting, setIsLossSubmitting] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editOpp, setEditOpp] = useState<Opportunity | null>(null);
    const [editProduct, setEditProduct] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [editSource, setEditSource] = useState('');
    const [editProbability, setEditProbability] = useState('');
    const [editEstimatedCloseDate, setEditEstimatedCloseDate] = useState('');
    const [editNextActionAt, setEditNextActionAt] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'high-value' | 'high-score' | 'stagnant'>('all');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteOppId, setDeleteOppId] = useState<number | null>(null);
    const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

    // Form state
    const [clientId, setClientId] = useState('');
    const [product, setProduct] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [scores, setScores] = useState<Record<number, { score: number; classification: string }>>({});

    const allOpportunities = Array.isArray(opportunities) ? opportunities : [];

    const stages = summaryData?.stages?.length
        ? summaryData.stages
        : ([
            { id: 'pendiente', label: 'Pendiente', category: 'open', order: 10 },
            { id: 'negociacion', label: 'Negociación', category: 'open', order: 20 },
            { id: 'ganado', label: 'Ganado', category: 'won', order: 90 },
            { id: 'perdido', label: 'Perdido', category: 'lost', order: 100 }
        ] as Array<{ id: string; label: string; category: PipelineStageCategory; order: number }>);

    const stageCategoryById = stages.reduce<Record<string, PipelineStageCategory>>((acc, s) => {
        acc[s.id] = s.category;
        return acc;
    }, {});

    const stageIdsKey = stages.map(s => s.id).join('|');
    const stageIdSet = new Set(stages.map(s => s.id));

    const defaultOpenStageId = stages.find(s => s.category === 'open')?.id || stages[0]?.id || 'pendiente';
    const defaultWonStageId = stages.find(s => s.category === 'won')?.id;
    const defaultLostStageId = stages.find(s => s.category === 'lost')?.id;

    useEffect(() => {
        if (!status || !stageIdSet.has(status)) {
            setStatus(defaultOpenStageId);
        }
        if (focusStageId && !stageIdSet.has(focusStageId)) {
            setFocusStageId('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultOpenStageId, stageIdsKey]);

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
            return daysDiff > 30 && stageCategoryById[opp.status] === 'open';
        }
        return true;
    });

    const safeOpportunities = focusStageId ? filteredOpportunities.filter(o => o.status === focusStageId) : filteredOpportunities;
    const totalMatches = summaryData?.total ?? pagination.total ?? safeOpportunities.length;
    const summaryByStatus = summaryData?.byStatus ?? {};
    const amountByStatus = summaryData?.amountByStatus ?? {};

    useEffect(() => {
        const fetchScores = async () => {
            const newScores: Record<number, { score: number; classification: string }> = { ...scores };
            let hasChanges = false;

            const pendingOpps = safeOpportunities
                .filter(opp => stageCategoryById[opp.status] === 'open' && !newScores[opp.id])
                .slice(0, 3);

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

    const handleUpdateStatus = useCallback(async (id: number, newStatus: string) => {
        try {
            if (stageCategoryById[newStatus] === 'lost') {
                setLossOppId(id);
                setLossTargetStatus(newStatus);
                setLossReason('');
                setLossReasonDetail('');
                setIsLossModalOpen(true);
                return;
            }

            await updateOpportunityStatus(id, { status: newStatus });
        } catch (error: unknown) {
            console.error(error);
            toast.error('No se pudo actualizar el estado de la oportunidad.');
        }
    }, [stageCategoryById, updateOpportunityStatus]);

    const handleDragEnd = useCallback((result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (destination.droppableId === source.droppableId) {
            return;
        }

        const match = /^opp-(\d+)$/.exec(draggableId);
        const opportunityId = match ? Number(match[1]) : NaN;
        if (!Number.isFinite(opportunityId)) return;

        if (!stageIdSet.has(destination.droppableId)) {
            return;
        }

        const newStatus = destination.droppableId;

        handleUpdateStatus(opportunityId, newStatus);
    }, [handleUpdateStatus, stageIdSet]);

    const settings = (tenantPlan?.settings || {}) as Record<string, unknown>;
    const lossReasons = Array.isArray(settings.lossReasons) && settings.lossReasons.length > 0
        ? settings.lossReasons.filter((v) => typeof v === 'string' && v.trim()).map((v) => String(v))
        : ['Precio', 'Competencia', 'Sin respuesta', 'No encaja', 'Timing', 'Otro'];

    const toDateInputValue = (value?: string) => {
        if (!value) return '';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '';
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const toDatetimeLocalValue = (value?: string) => {
        if (!value) return '';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '';
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    };

    const openEdit = (opp: Opportunity) => {
        setEditOpp(opp);
        setEditProduct(opp.product || '');
        setEditAmount(String(opp.amount ?? ''));
        setEditSource(opp.source || '');
        setEditProbability(opp.probability !== undefined && opp.probability !== null ? String(opp.probability) : '');
        setEditEstimatedCloseDate(toDateInputValue(opp.estimated_close_date));
        setEditNextActionAt(toDatetimeLocalValue(opp.next_action_at));
        setEditNotes(opp.notes || '');
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editOpp) return;

        setIsEditSubmitting(true);
        try {
            const payload: Record<string, unknown> = {
                product: editProduct.trim(),
                amount: Number(editAmount),
                source: editSource.trim() ? editSource.trim() : undefined,
                probability: editProbability.trim() ? Number(editProbability) : undefined,
                estimated_close_date: editEstimatedCloseDate ? new Date(editEstimatedCloseDate).toISOString() : '',
                next_action_at: editNextActionAt ? new Date(editNextActionAt).toISOString() : '',
                notes: editNotes.trim() ? editNotes.trim() : '',
            };

            await updateOpportunity(editOpp.id, sanitizePayload(payload) as any);
            setIsEditModalOpen(false);
            setEditOpp(null);
        } catch (error: unknown) {
            console.error(error);
            toast.error('No se pudo guardar la oportunidad.');
        } finally {
            setIsEditSubmitting(false);
        }
    };

    const handleConfirmLoss = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lossOppId) return;
        if (!lossTargetStatus) return;
        if (!lossReason.trim()) return;

        setIsLossSubmitting(true);
        try {
            await updateOpportunityStatus(lossOppId, {
                status: lossTargetStatus,
                lost_reason: lossReason.trim(),
                lost_reason_detail: lossReasonDetail.trim() ? lossReasonDetail.trim() : undefined
            });
            setIsLossModalOpen(false);
            setLossOppId(null);
            setLossTargetStatus(null);
            setLossReason('');
            setLossReasonDetail('');
        } catch (error: unknown) {
            console.error(error);
            toast.error('No se pudo marcar como perdida. Inténtalo de nuevo.');
        } finally {
            setIsLossSubmitting(false);
        }
    };

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
            setStatus(defaultOpenStageId);
        } catch (error: unknown) {
            console.error(error);
            toast.error('No se pudo crear la oportunidad. Inténtalo de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const visibleStages = focusStageId ? stages.filter(s => s.id === focusStageId) : stages;
    const columnConfig = visibleStages.map((s) => ({
        id: s.id,
        title: s.label,
        color: s.category === 'open' ? 'bg-primary-500' : s.category === 'won' ? 'bg-success-icon' : 'bg-danger-icon'
    }));

    const requestDelete = useCallback((id: number) => {
        setDeleteOppId(id);
        setIsDeleteModalOpen(true);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!deleteOppId) return;
        try {
            setIsDeleteSubmitting(true);
            const res = await deleteOpportunity(deleteOppId);
            toast.success(res?.message || 'Oportunidad eliminada');
            setIsDeleteModalOpen(false);
            setDeleteOppId(null);
        } catch (error: any) {
            toast.error(error?.message || 'No se pudo eliminar la oportunidad');
        } finally {
            setIsDeleteSubmitting(false);
        }
    }, [deleteOppId, deleteOpportunity]);

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-140px)]">
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    if (isDeleteSubmitting) return;
                    setIsDeleteModalOpen(false);
                    setDeleteOppId(null);
                }}
                onConfirm={confirmDelete}
                title="Eliminar oportunidad"
                message="Se eliminará la oportunidad y dejará de aparecer en el pipeline. Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                variant="danger"
                isLoading={isDeleteSubmitting}
            />
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

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={focusStageId}
                            onChange={(e) => setFocusStageId(e.target.value)}
                            className="h-10 px-3 bg-surface-input border border-surface-border rounded-lg text-sm text-surface-text focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-sm"
                        >
                            <option value="">Todas las etapas</option>
                            {stages.map((s) => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                        </select>

                        <div className="flex items-center bg-surface-muted-bg p-1 rounded-lg border border-surface-border">
                            <button
                                onClick={() => setMineOnly((v) => !v)}
                                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${mineOnly
                                    ? 'bg-surface-card text-surface-text shadow-sm border border-surface-border'
                                    : 'text-surface-muted hover:text-surface-text'}`}
                            >
                                Mías
                            </button>
                            <button
                                onClick={() => setOverdueOnly((v) => !v)}
                                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${overdueOnly
                                    ? 'bg-surface-card text-surface-text shadow-sm border border-surface-border'
                                    : 'text-surface-muted hover:text-surface-text'}`}
                            >
                                Vencidas
                            </button>
                        </div>

                        <input
                            type="number"
                            value={amountMin}
                            onChange={(e) => setAmountMin(e.target.value)}
                            placeholder="Min €"
                            className="w-24 h-10 px-3 bg-surface-input border border-surface-border rounded-lg text-sm text-surface-text placeholder:text-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-sm"
                        />
                        <input
                            type="number"
                            value={amountMax}
                            onChange={(e) => setAmountMax(e.target.value)}
                            placeholder="Max €"
                            className="w-24 h-10 px-3 bg-surface-input border border-surface-border rounded-lg text-sm text-surface-text placeholder:text-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-sm"
                        />
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
                                        {summaryByStatus[column.id] ?? 0}
                                    </Badge>
                                    <span className="text-[10px] font-bold text-surface-muted tabular-nums">
                                        {formatMoney(Number(amountByStatus[column.id] || 0), { maximumFractionDigits: 0 })}
                                    </span>
                                </div>
                                <Dropdown
                                    trigger={(
                                        <button
                                            type="button"
                                            className="text-surface-muted hover:text-surface-text transition-colors"
                                            aria-label="Opciones de etapa"
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                    )}
                                    options={[
                                        {
                                            id: focusStageId === column.id ? 'show-all' : 'focus-stage',
                                            label: focusStageId === column.id ? 'Ver todas las etapas' : 'Ver solo esta etapa',
                                            icon: <Target size={14} />
                                        },
                                        {
                                            id: 'edit-stages',
                                            label: 'Editar etapas',
                                            icon: <Briefcase size={14} />
                                        }
                                    ]}
                                    onSelect={(opt) => {
                                        if (opt.id === 'focus-stage') setFocusStageId(column.id);
                                        if (opt.id === 'show-all') setFocusStageId('');
                                        if (opt.id === 'edit-stages') navigate('/settings?tab=sales');
                                    }}
                                    align="right"
                                />
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
                                                                canDeleteOpportunity={canDeleteOpportunity}
                                                                onUpdateStatus={handleUpdateStatus}
                                                                onEdit={openEdit}
                                                                onDelete={requestDelete}
                                                                stageCategoryById={stageCategoryById}
                                                                defaultOpenStageId={defaultOpenStageId}
                                                                defaultWonStageId={defaultWonStageId}
                                                                defaultLostStageId={defaultLostStageId}
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
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            {stages.map((s) => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
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

            <Modal
                isOpen={isLossModalOpen}
                onClose={() => {
                    if (isLossSubmitting) return;
                    setIsLossModalOpen(false);
                    setLossOppId(null);
                    setLossTargetStatus(null);
                }}
                title="Motivo de pérdida"
                maxWidth="max-w-xl"
            >
                <form onSubmit={handleConfirmLoss} className="space-y-4">
                    <Select
                        label="Motivo"
                        required
                        value={lossReason}
                        onChange={(e) => setLossReason(e.target.value)}
                    >
                        <option value="">Selecciona un motivo...</option>
                        {lossReasons.map((r) => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </Select>

                    <div className="w-full">
                        <label className="block mb-1 text-[11px] font-bold text-surface-muted uppercase tracking-wider">
                            Detalle (opcional)
                        </label>
                        <textarea
                            value={lossReasonDetail}
                            onChange={(e) => setLossReasonDetail(e.target.value)}
                            rows={4}
                            className="w-full rounded-xl text-sm transition-all bg-surface-input border border-surface-border text-surface-text placeholder:text-surface-muted focus:border-primary-500 focus:ring-primary-500/20 focus:outline-none focus:ring-2 px-4 py-3 shadow-sm"
                            placeholder="Ej: el cliente pidió integración X y no la tenemos…"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (isLossSubmitting) return;
                                setIsLossModalOpen(false);
                                setLossOppId(null);
                                setLossTargetStatus(null);
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            isLoading={isLossSubmitting}
                            disabled={!lossReason.trim()}
                        >
                            Marcar como perdida
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    if (isEditSubmitting) return;
                    setIsEditModalOpen(false);
                    setEditOpp(null);
                }}
                title="Editar oportunidad"
                maxWidth="max-w-xl"
            >
                <form onSubmit={handleSaveEdit} className="space-y-4">
                    <Input
                        label="Producto / Solución"
                        required
                        value={editProduct}
                        onChange={(e) => setEditProduct(e.target.value)}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Importe (€)"
                            type="number"
                            required
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                        />
                        <Input
                            label="Fuente"
                            value={editSource}
                            onChange={(e) => setEditSource(e.target.value)}
                            placeholder="Ej: web, referral, llamada..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Probabilidad (%)"
                            type="number"
                            value={editProbability}
                            onChange={(e) => setEditProbability(e.target.value)}
                            placeholder="0 - 100"
                        />
                        <Input
                            label="Próxima acción"
                            type="datetime-local"
                            value={editNextActionAt}
                            onChange={(e) => setEditNextActionAt(e.target.value)}
                        />
                    </div>

                    <Input
                        label="Cierre estimado"
                        type="date"
                        value={editEstimatedCloseDate}
                        onChange={(e) => setEditEstimatedCloseDate(e.target.value)}
                    />

                    <div className="w-full">
                        <label className="block mb-1 text-[11px] font-bold text-surface-muted uppercase tracking-wider">
                            Notas
                        </label>
                        <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            rows={5}
                            className="w-full rounded-xl text-sm transition-all bg-surface-input border border-surface-border text-surface-text placeholder:text-surface-muted focus:border-primary-500 focus:ring-primary-500/20 focus:outline-none focus:ring-2 px-4 py-3 shadow-sm"
                            placeholder="Contexto, próximos pasos, objeciones..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (isEditSubmitting) return;
                                setIsEditModalOpen(false);
                                setEditOpp(null);
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            isLoading={isEditSubmitting}
                            disabled={!editProduct.trim() || !editAmount.trim()}
                        >
                            Guardar
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PipelineView;
