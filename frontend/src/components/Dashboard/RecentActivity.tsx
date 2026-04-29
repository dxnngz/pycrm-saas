import { History, ArrowUpRight, CheckSquare } from 'lucide-react';
import { Badge } from '../UI/Badge';

interface Activity {
    id: string;
    type: 'sale' | 'task-done' | 'task-new';
    title: string;
    description: string;
    time: string;
    amount?: number;
}

interface RecentActivityProps {
    activities: Activity[];
}

const RecentActivity = ({ activities }: RecentActivityProps) => {
    return (
        <div className="bg-surface-card rounded-lg border border-surface-border shadow-sm h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-surface-border bg-surface-muted-bg/50">
                <h3 className="text-[11px] font-bold text-surface-text uppercase tracking-wider flex items-center gap-2">
                    <History size={14} className="text-primary-600 dark:text-primary-400" />
                    Activity Stream
                </h3>
                <Badge variant="success" className="animate-pulse">Live</Badge>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-surface-border/50">
                {activities.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-20 text-surface-muted">
                        <History size={32} className="mb-2 opacity-20" />
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">No recent activity</p>
                    </div>
                ) : activities.map((activity) => (
                    <div key={activity.id} className="p-3 hover:bg-surface-hover transition-colors flex gap-3 group">
                        <div className={`h-8 w-8 shrink-0 rounded flex items-center justify-center border ${activity.type === 'sale'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                : 'bg-primary-50 text-primary-600 border-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20'
                            }`}>
                            {activity.type === 'sale' ? <ArrowUpRight size={14} /> : <CheckSquare size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                                <h4 className="font-bold text-xs text-surface-text truncate">{activity.title}</h4>
                                <span className="text-[9px] font-bold text-surface-muted uppercase tracking-wider shrink-0 mt-0.5">{activity.time}</span>
                            </div>
                            <p className="text-[11px] text-surface-muted truncate mt-0.5">{activity.description}</p>
                            {activity.amount && (
                                <div className="mt-1.5 leading-none">
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                        +{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(activity.amount))}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-3 border-t border-surface-border bg-surface-muted-bg/20">
                <button className="w-full py-2 text-[10px] font-bold text-surface-muted hover:text-primary-600 transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                    View Full Audit Trail
                </button>
            </div>
        </div>
    );
};

export default RecentActivity;
