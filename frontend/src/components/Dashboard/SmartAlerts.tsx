import React from 'react';
import { AlertCircle, Clock, Zap } from 'lucide-react';
import { Card } from '../UI/Card';
import { Badge } from '../UI/Badge';

interface Alert {
    id: string;
    type: 'stagnant' | 'urgent' | 'high-prob';
    title: string;
    description: string;
    targetId?: number;
}

interface SmartAlertsProps {
    opportunities: any[];
    tasks: any[];
}

const SmartAlerts: React.FC<SmartAlertsProps> = ({ opportunities = [], tasks = [] }) => {
    const alerts: Alert[] = [];

    // 1. Identify Stagnant Deals (>30 days since creation without closing)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    opportunities.filter(o => o.status === 'pendiente').forEach(opp => {
        const createdDate = new Date(opp.created_at || new Date());
        if (createdDate < thirtyDaysAgo) {
            alerts.push({
                id: `stagnant-${opp.id}`,
                type: 'stagnant',
                title: 'Stagnant Deal',
                description: `${opp.product} for ${opp.client_company} has seen no movement in 30 days.`,
                targetId: opp.id
            });
        }
    });

    // 2. Identify Urgent Tasks (due in < 24h)
    const twentyFourHoursFromNow = new Date();
    twentyFourHoursFromNow.setHours(twentyFourHoursFromNow.getHours() + 24);

    tasks.filter(t => t.status === 'pendiente').forEach(task => {
        const dueDate = new Date(task.due_date);
        if (dueDate < twentyFourHoursFromNow && dueDate > new Date()) {
            alerts.push({
                id: `task-${task.id}`,
                type: 'urgent',
                title: 'Urgent Deadline',
                description: `Task "${task.title}" is due in less than 24 hours.`,
                targetId: task.id
            });
        }
    });

    if (alerts.length === 0) {
        return (
            <Card className="h-full flex flex-col items-center justify-center text-center p-8 border-dashed opacity-60">
                <Zap size={32} className="text-slate-300 mb-3" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Critical Alerts</h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tight">Your pipeline operational health is optimal.</p>
            </Card>
        );
    }

    return (
        <Card className="h-full space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">Smart Intelligence</h3>
                    <p className="text-[9px] text-slate-500 font-bold mt-0.5 uppercase tracking-tight">Proactive risk & opportunity mapping</p>
                </div>
                <Badge variant="secondary">{alerts.length}</Badge>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[320px] pr-2 custom-scrollbar">
                {alerts.map(alert => (
                    <div
                        key={alert.id}
                        className={`p-3 rounded-lg border flex gap-3 transition-all hover:translate-x-1 ${alert.type === 'stagnant'
                            ? 'bg-amber-50/50 dark:bg-amber-500/5 border-amber-200/50 dark:border-amber-500/20'
                            : 'bg-red-50/50 dark:bg-red-500/5 border-red-200/50 dark:border-red-500/20'
                            }`}
                    >
                        <div className={`mt-0.5 ${alert.type === 'stagnant' ? 'text-amber-600' : 'text-red-600'}`}>
                            {alert.type === 'stagnant' ? <Clock size={16} /> : <AlertCircle size={16} />}
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                {alert.title}
                            </h4>
                            <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 font-bold opacity-80 uppercase tracking-tight">
                                {alert.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default SmartAlerts;
