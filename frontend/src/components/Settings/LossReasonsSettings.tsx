import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Badge } from '../UI/Badge';
import { useTenantPlan } from '../../hooks/useTenantPlan';
import { tenantService } from '../../services/tenant.service';

const DEFAULT_LOSS_REASONS = ['Precio', 'Competencia', 'Sin respuesta', 'No encaja', 'Timing', 'Otro'];

const normalizeReasons = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    const items = value
        .map((v) => (typeof v === 'string' ? v.trim() : ''))
        .filter(Boolean);
    return Array.from(new Set(items));
};

const LossReasonsSettings = () => {
    const queryClient = useQueryClient();
    const { data, isLoading } = useTenantPlan();

    const settings = (data?.settings || {}) as Record<string, unknown>;
    const initialReasons = useMemo(() => {
        const reasons = normalizeReasons(settings.lossReasons);
        return reasons.length > 0 ? reasons : DEFAULT_LOSS_REASONS;
    }, [settings.lossReasons]);

    const [reasons, setReasons] = useState<string[]>(initialReasons);
    const [newReason, setNewReason] = useState('');

    useEffect(() => {
        setReasons(initialReasons);
    }, [initialReasons]);

    const updateMutation = useMutation({
        mutationFn: (nextSettings: Record<string, unknown>) => tenantService.updateSettings(nextSettings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant_plan'] });
            toast.success('Motivos de pérdida actualizados');
        },
        onError: (e: unknown) => {
            const msg = e instanceof Error ? e.message : 'No se pudo guardar';
            toast.error(msg);
        }
    });

    const addReason = () => {
        const v = newReason.trim();
        if (!v) return;
        if (reasons.some((r) => r.toLowerCase() === v.toLowerCase())) {
            toast.error('Ese motivo ya existe');
            return;
        }
        setReasons((prev) => [...prev, v]);
        setNewReason('');
    };

    const removeReason = (value: string) => {
        setReasons((prev) => prev.filter((r) => r !== value));
    };

    const save = async () => {
        const nextSettings: Record<string, unknown> = {
            ...settings,
            lossReasons: reasons.length > 0 ? reasons : DEFAULT_LOSS_REASONS
        };
        await updateMutation.mutateAsync(nextSettings);
    };

    if (isLoading) {
        return (
            <div className="max-w-2xl space-y-4">
                <div className="h-10 bg-surface-muted-bg/40 border border-surface-border rounded-xl animate-pulse" />
                <div className="h-40 bg-surface-muted-bg/40 border border-surface-border rounded-xl animate-pulse" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <h3 className="text-sm font-bold text-surface-text">Motivos de pérdida</h3>
                    <p className="text-xs text-surface-muted">
                        Se usarán al marcar oportunidades como perdidas para tener reporting realista.
                    </p>
                </div>
                <Badge variant="secondary">{reasons.length}</Badge>
            </div>

            <div className="flex gap-3">
                <Input
                    label="Nuevo motivo"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    placeholder="Ej: Presupuesto agotado"
                />
                <div className="pt-6">
                    <Button variant="outline" onClick={addReason} disabled={!newReason.trim()}>
                        Añadir
                    </Button>
                </div>
            </div>

            <div className="rounded-xl border border-surface-border bg-surface-card p-4 space-y-3">
                {reasons.map((r) => (
                    <div key={r} className="flex items-center justify-between gap-3">
                        <div className="text-sm text-surface-text font-medium">{r}</div>
                        <Button variant="outline" size="sm" onClick={() => removeReason(r)}>
                            Quitar
                        </Button>
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

export default LossReasonsSettings;

