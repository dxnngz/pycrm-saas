import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Badge } from '../UI/Badge';
import { Select } from '../UI/Select';
import { useTenantPlan } from '../../hooks/useTenantPlan';
import { tenantService } from '../../services/tenant.service';
import type { PipelineStage, PipelineStageCategory } from '../../types';

const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
    { id: 'pendiente', label: 'Pendiente', category: 'open', order: 10 },
    { id: 'negociacion', label: 'Negociación', category: 'open', order: 20 },
    { id: 'ganado', label: 'Ganado', category: 'won', order: 90 },
    { id: 'perdido', label: 'Perdido', category: 'lost', order: 100 },
];

const normalizeStages = (value: unknown): PipelineStage[] => {
    if (!Array.isArray(value)) return [];
    const items: PipelineStage[] = [];
    for (let i = 0; i < value.length; i++) {
        const raw = value[i] as any;
        const id = typeof raw?.id === 'string' ? raw.id.trim() : '';
        const label = typeof raw?.label === 'string' ? raw.label.trim() : '';
        const category = raw?.category as PipelineStageCategory;
        const order = typeof raw?.order === 'number' ? raw.order : i * 10;

        if (!id || !label) continue;
        if (category !== 'open' && category !== 'won' && category !== 'lost') continue;
        items.push({ id, label, category, order });
    }
    const dedup = new Map<string, PipelineStage>();
    for (const s of items) {
        if (!dedup.has(s.id)) dedup.set(s.id, s);
    }
    return Array.from(dedup.values()).sort((a, b) => a.order - b.order);
};

const ensureRequiredStages = (stages: PipelineStage[]): PipelineStage[] => {
    if (!Array.isArray(stages) || stages.length === 0) return DEFAULT_PIPELINE_STAGES;

    const hasOpen = stages.some((s) => s.category === 'open');
    const hasWon = stages.some((s) => s.category === 'won');
    const hasLost = stages.some((s) => s.category === 'lost');
    if (hasOpen && hasWon && hasLost) return stages;

    const byId = new Map<string, PipelineStage>();
    for (const s of stages) byId.set(s.id, s);

    for (const def of DEFAULT_PIPELINE_STAGES) {
        if (def.category === 'open' && !hasOpen) byId.set(def.id, def);
        if (def.category === 'won' && !hasWon) byId.set(def.id, def);
        if (def.category === 'lost' && !hasLost) byId.set(def.id, def);
    }

    return Array.from(byId.values()).sort((a, b) => a.order - b.order);
};

const reindex = (stages: PipelineStage[]) =>
    stages.map((s, idx) => ({ ...s, order: (idx + 1) * 10 }));

const PipelineStagesSettings = () => {
    const queryClient = useQueryClient();
    const { data, isLoading } = useTenantPlan();

    const settings = (data?.settings || {}) as Record<string, unknown>;
    const initialStages = useMemo(() => {
        const items = normalizeStages((settings as any).pipelineStages);
        return ensureRequiredStages(items);
    }, [settings]);

    const [stages, setStages] = useState<PipelineStage[]>(initialStages);
    const [newId, setNewId] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [newCategory, setNewCategory] = useState<PipelineStageCategory>('open');

    useEffect(() => {
        setStages(initialStages);
    }, [initialStages]);

    const updateMutation = useMutation({
        mutationFn: (nextSettings: Record<string, unknown>) => tenantService.updateSettings(nextSettings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant_plan'] });
            queryClient.invalidateQueries({ queryKey: ['opportunities'] });
            queryClient.invalidateQueries({ queryKey: ['opportunity_summary'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_data'] });
            toast.success('Etapas del pipeline actualizadas');
        },
        onError: (e: unknown) => {
            const msg = e instanceof Error ? e.message : 'No se pudo guardar';
            toast.error(msg);
        }
    });

    const addStage = () => {
        const id = newId.trim();
        const label = newLabel.trim();
        if (!id || !label) return;
        if (/\s/.test(id)) {
            toast.error('El ID no puede contener espacios');
            return;
        }
        if (stages.some((s) => s.id.toLowerCase() === id.toLowerCase())) {
            toast.error('Ese ID ya existe');
            return;
        }
        const next = reindex([...stages, { id, label, category: newCategory, order: 0 }]);
        setStages(next);
        setNewId('');
        setNewLabel('');
        setNewCategory('open');
    };

    const removeStage = (id: string) => {
        setStages((prev) => reindex(prev.filter((s) => s.id !== id)));
    };

    const moveStage = (id: string, dir: -1 | 1) => {
        setStages((prev) => {
            const idx = prev.findIndex((s) => s.id === id);
            if (idx < 0) return prev;
            const nextIdx = idx + dir;
            if (nextIdx < 0 || nextIdx >= prev.length) return prev;
            const copy = [...prev];
            const [item] = copy.splice(idx, 1);
            copy.splice(nextIdx, 0, item);
            return reindex(copy);
        });
    };

    const updateStage = (id: string, patch: Partial<PipelineStage>) => {
        setStages((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    };

    const save = async () => {
        const normalized = normalizeStages(stages);
        const finalStages = ensureRequiredStages(normalized);
        const hasOpen = finalStages.some((s) => s.category === 'open');
        const hasWon = finalStages.some((s) => s.category === 'won');
        const hasLost = finalStages.some((s) => s.category === 'lost');
        if (!hasOpen || !hasWon || !hasLost) {
            toast.error('Debe existir al menos 1 etapa abierta, 1 ganada y 1 perdida.');
            return;
        }
        const nextSettings: Record<string, unknown> = {
            ...settings,
            pipelineStages: finalStages
        };
        await updateMutation.mutateAsync(nextSettings);
    };

    if (isLoading) {
        return (
            <div className="max-w-3xl space-y-4">
                <div className="h-10 bg-surface-muted-bg/40 border border-surface-border rounded-xl animate-pulse" />
                <div className="h-56 bg-surface-muted-bg/40 border border-surface-border rounded-xl animate-pulse" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <h3 className="text-sm font-bold text-surface-text">Etapas del pipeline</h3>
                    <p className="text-xs text-surface-muted">
                        Cambia el flujo de ventas de tu equipo. Evita modificar IDs si ya tienes oportunidades creadas.
                    </p>
                </div>
                <Badge variant="secondary">{stages.length}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <Input
                    label="ID"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="ej: propuesta"
                />
                <Input
                    label="Nombre"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Ej: Propuesta"
                />
                <Select
                    label="Categoría"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as PipelineStageCategory)}
                >
                    <option value="open">Abierta</option>
                    <option value="won">Ganada</option>
                    <option value="lost">Perdida</option>
                </Select>
                <div className="md:col-span-3 flex justify-end">
                    <Button variant="outline" onClick={addStage} disabled={!newId.trim() || !newLabel.trim()}>
                        Añadir etapa
                    </Button>
                </div>
            </div>

            <div className="rounded-xl border border-surface-border bg-surface-card p-4 space-y-3">
                {stages.map((s, idx) => (
                    <div key={s.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-3">
                            <Input label="ID" value={s.id} disabled />
                        </div>
                        <div className="md:col-span-4">
                            <Input
                                label="Nombre"
                                value={s.label}
                                onChange={(e) => updateStage(s.id, { label: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-3">
                            <Select
                                label="Categoría"
                                value={s.category}
                                onChange={(e) => updateStage(s.id, { category: e.target.value as PipelineStageCategory })}
                            >
                                <option value="open">Abierta</option>
                                <option value="won">Ganada</option>
                                <option value="lost">Perdida</option>
                            </Select>
                        </div>
                        <div className="md:col-span-2 flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => moveStage(s.id, -1)} disabled={idx === 0}>
                                Subir
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => moveStage(s.id, 1)} disabled={idx === stages.length - 1}>
                                Bajar
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeStage(s.id)}
                                disabled={stages.length <= 3 || stages.filter((x) => x.category === s.category).length <= 1}
                            >
                                Quitar
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end">
                <Button variant="primary" onClick={save} isLoading={updateMutation.isPending}>
                    Guardar
                </Button>
            </div>
        </div>
    );
};

export default PipelineStagesSettings;
