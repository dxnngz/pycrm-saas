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
            className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary-500/50 transition-all cursor-grab active:cursor-grabbing group"
        >
            <div className="flex flex-col gap-2 mb-3">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{opp.client_company}</span>
                    {opp.status === 'pendiente' && scores[opp.id] && (
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            <TrendingUp size={10} />
                            {scores[opp.id].score}%
                        </div>
                    )}
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors uppercase tracking-tight">{opp.product}</h4>
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200 dark:border-slate-700">
                        {opp.client_name?.charAt(0)}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{opp.client_name}</p>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/50">
                <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(opp.amount)}
                </div>

                <div className="flex items-center gap-1">
                    {canEditOpportunity && opp.status === 'pendiente' && (
                        <>
                            <button
                                onClick={() => onUpdateStatus(opp.id, 'ganado')}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded transition-colors"
                                title="Mark as Won"
                            >
                                <Check size={14} />
                            </button>
                            <button
                                onClick={() => onUpdateStatus(opp.id, 'perdido')}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                                title="Mark as Lost"
                            >
                                <X size={14} />
                            </button>
                        </>
                    )}
                    {canEditOpportunity && opp.status !== 'pendiente' && (
                        <button
                            onClick={() => onUpdateStatus(opp.id, 'pendiente')}
                            className="text-[10px] font-bold text-slate-400 hover:text-primary-600 transition-colors uppercase"
                        >
                            Reopen
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

OpportunityCard.displayName = 'OpportunityCard';

import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualColumnBody = ({
    opps,
    provided,
    snapshot,
    scores,
    canCreateOpportunity,
    handleUpdateStatus
}: {
    opps: Opportunity[],
    provided: unknown,
    snapshot: unknown,
    scores: Record<number, { score: number; classification: string }>,
    canCreateOpportunity: boolean,
    handleUpdateStatus: (id: number, status: 'pendiente' | 'ganado' | 'perdido') => void
}) => {
    const parentRef = React.useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: opps.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 160, // Estimated height of OpportunityCard
        overscan: 5,
    });

    const p = provided as Record<string, unknown>;
    const s = snapshot as Record<string, unknown>;

    return (
        <div
            ref={(el) => {
                (p.innerRef as (el: HTMLElement | null) => void)(el);
                (parentRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
            }}
            {...(p.droppableProps as Record<string, unknown>)}
            className={`flex-1 overflow-y-auto custom-scrollbar p-3 rounded-lg border transition-colors min-h-[400px] ${(s.isDraggingOver as boolean) ? 'bg-slate-50 dark:bg-slate-800/50 border-primary-500/30' : 'bg-slate-50/30 dark:bg-slate-900/10 border-slate-200 dark:border-slate-800'}`}
        >
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const opp = opps[virtualRow.index];
                    return (
                        <div
                            key={opp.id}
                            className="absolute top-0 left-0 w-full"
                            style={{
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            <Draggable draggableId={`opp-${opp.id}`} index={virtualRow.index} isDragDisabled={!canCreateOpportunity}>
                                {(draggableProvided, draggableSnapshot) => (
                                    <div
                                        ref={draggableProvided.innerRef}
                                        {...draggableProvided.draggableProps}
                                        {...draggableProvided.dragHandleProps}
                                        style={{ ...draggableProvided.draggableProps.style, opacity: draggableSnapshot.isDragging ? 0.8 : 1 }}
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
                        </div>
                    );
                })}
            </div>
            {p.placeholder as React.ReactNode}
        </div>
    );
};

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

    const { opportunities, loading: oppsLoading, pagination, loadOpportunities, createOpportunity, updateOpportunityStatus } = useOpportunities(page, 50, debouncedSearch);
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
                        const data = await getOpportunityScore(opp.id);
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
            toast.error('Failed to update opportunity status.');
        }
    }, [updateOpportunityStatus]);

    const handleDragEnd = useCallback((result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
        }

        const opportunityId = parseInt(draggableId.replace('opp-', ''), 10);
        const newStatus = destination.droppableId as 'pendiente' | 'ganado' | 'perdido';

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
            loadOpportunities(pagination.page, pagination.limit, search);
        } catch (error: unknown) {
            console.error(error);
            toast.error('Failed to create opportunity. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const columnConfig = [
        { id: 'pendiente' as const, title: 'Pipeline', color: 'bg-primary-500' },
        { id: 'ganado' as const, title: 'Won', color: 'bg-emerald-500' },
        { id: 'perdido' as const, title: 'Lost', color: 'bg-slate-500' }
    ];

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-140px)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Sales Pipeline</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        AI-powered opportunity tracking and forecasting.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        {[
                            { id: 'all', label: 'All', icon: Briefcase },
                            { id: 'high-value', label: 'High Value', icon: TrendingUp },
                            { id: 'high-score', label: 'High Prob.', icon: Target },
                            { id: 'stagnant', label: 'Stagnant', icon: Zap }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setActiveFilter(f.id as typeof activeFilter)}
                                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 ${activeFilter === f.id
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                <f.icon size={12} />
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative group w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search opportunities..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                        />
                    </div>
                    {canCreateOpportunity && (
                        <Button
                            variant="primary"
                            size="md"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <Plus size={18} className="mr-2" />
                            New Opportunity
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
                                    <h3 className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">{column.title}</h3>
                                    <Badge variant="secondary">
                                        {safeOpportunities.filter(o => o.status === column.id).length}
                                    </Badge>
                                </div>
                                <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    <MoreVertical size={16} />
                                </button>
                            </div>

                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => {
                                    const columnOpps = safeOpportunities.filter(o => o.status === column.id);

                                    if (loading) {
                                        return (
                                            <div className="space-y-3 p-3 bg-slate-50/30 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800 rounded-lg flex-1">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 animate-pulse"></div>
                                                ))}
                                            </div>
                                        );
                                    }

                                    if (columnOpps.length === 0) {
                                        return (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-white/50 dark:bg-slate-900/50 h-32 ${snapshot.isDraggingOver ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}
                                            >
                                                <Target size={24} className="mb-2 opacity-20" />
                                                <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">No deals</p>
                                                {provided.placeholder}
                                            </div>
                                        );
                                    }

                                    return (
                                        <VirtualColumnBody
                                            opps={columnOpps}
                                            provided={provided}
                                            snapshot={snapshot}
                                            scores={scores}
                                            canCreateOpportunity={canCreateOpportunity}
                                            handleUpdateStatus={handleUpdateStatus}
                                        />
                                    );
                                }}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            {/* Creation Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create Opportunity"
                maxWidth="max-w-xl"
            >
                <form onSubmit={handleCreateOpportunity} className="space-y-4">
                    <Select
                        label="Account / Client"
                        required
                        name="clientId"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                    >
                        <option value="">Select a client...</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </Select>

                    <Input
                        label="Product / Solution"
                        type="text"
                        required
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
                        placeholder="e.g. Enterprise Solution"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Deal Value ($)"
                            type="number"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                        />
                        <Select
                            label="Pipeline Stage"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as 'pendiente' | 'ganado' | 'perdido')}
                        >
                            <option value="pendiente">Pending</option>
                            <option value="ganado">Won</option>
                            <option value="perdido">Lost</option>
                        </Select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            isLoading={isSubmitting}
                        >
                            Create Deal
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PipelineView;
