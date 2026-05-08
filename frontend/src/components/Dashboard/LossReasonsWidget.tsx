import { TrendingDown } from 'lucide-react';
import { Card } from '../UI/Card';
import { Badge } from '../UI/Badge';
import { formatMoney } from '../../utils/format';

interface LossReasonsWidgetProps {
    period?: 'monthly' | 'yearly';
    items: Array<{ reason: string; count: number; amount: number }>;
}

const LossReasonsWidget = ({ items, period = 'monthly' }: LossReasonsWidgetProps) => {
    const title = period === 'yearly' ? 'Pérdidas (año)' : 'Pérdidas (6 meses)';
    const maxAmount = items.reduce((acc, it) => Math.max(acc, Number(it.amount) || 0), 0) || 1;
    const totalAmount = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);

    return (
        <Card className="space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <h3 className="text-[11px] font-bold text-surface-text uppercase tracking-wider flex items-center gap-2">
                        <TrendingDown size={14} className="text-danger-icon" />
                        {title}
                    </h3>
                    <p className="text-[9px] text-surface-muted font-bold uppercase tracking-tight">
                        Por motivo de pérdida
                    </p>
                </div>
                <Badge variant="secondary">{formatMoney(totalAmount, { maximumFractionDigits: 0 })}</Badge>
            </div>

            {items.length === 0 ? (
                <div className="text-xs text-surface-muted">
                    No hay pérdidas registradas en este periodo.
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((it) => (
                        <div key={it.reason} className="space-y-1">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-xs font-semibold text-surface-text truncate">{it.reason}</div>
                                <div className="text-[11px] font-bold text-surface-muted tabular-nums shrink-0">
                                    {formatMoney(Number(it.amount) || 0, { maximumFractionDigits: 0 })} · {Number(it.count) || 0}
                                </div>
                            </div>
                            <div className="h-2 rounded-full bg-surface-muted-bg border border-surface-border overflow-hidden">
                                <div
                                    className="h-full bg-danger-icon/70"
                                    style={{ width: `${Math.min(100, ((Number(it.amount) || 0) / maxAmount) * 100)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

export default LossReasonsWidget;

