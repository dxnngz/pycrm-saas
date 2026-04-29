import { useQuery } from '@tanstack/react-query';
import {
    History,
    User,
    Clock,
    Activity,
    Info
} from 'lucide-react';
import { Skeleton } from '../UI/Skeleton';
import { Badge } from '../UI/Badge';

interface LogEntry {
    id: string | number;
    entity: string;
    entity_id: string | number;
    changes: Record<string, unknown> | null;
    action: string;
    user: { name: string };
    created_at: string;
}

export const AuditLogs = () => {
    const { data: logs, isLoading } = useQuery<LogEntry[]>({
        queryKey: ['audit-logs'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/audit`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Failed to fetch audit logs');
            return res.json();
        }
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-surface-text uppercase tracking-wider flex items-center gap-2">
                        <History size={16} className="text-primary-500" />
                        Enterprise Activity Log
                    </h3>
                    <p className="text-[10px] text-surface-muted font-bold uppercase mt-1">Immutable record of system mutations</p>
                </div>
                <Badge variant="info" className="text-[9px] px-2 py-0.5 border-surface-border">
                    Retention: 90 Days
                </Badge>
            </div>

            <div className="bg-surface-muted-bg/40 rounded-xl border border-surface-border overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-surface-border bg-surface-card/50">
                            <th className="px-4 py-3 text-[10px] font-bold text-surface-muted uppercase tracking-widest">Event</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-surface-muted uppercase tracking-widest text-center">Action</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-surface-muted uppercase tracking-widest">User</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-surface-muted uppercase tracking-widest text-right">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border/60">
                        {logs?.map((log) => (
                            <tr key={log.id} className="hover:bg-surface-hover/50 transition-colors group">
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-surface-card border border-surface-border text-surface-muted group-hover:text-primary-500 transition-colors">
                                            <Activity size={14} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-surface-text leading-none">
                                                {log.entity} <span className="text-[10px] text-surface-muted font-mono ml-1">#{log.entity_id}</span>
                                            </p>
                                            <p className="text-[10px] text-surface-muted mt-1 max-w-[200px] truncate">
                                                {log.changes ? JSON.stringify(log.changes) : 'No delta details'}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <Badge
                                        variant={
                                            log.action === 'CREATE' ? 'success' :
                                                log.action === 'DELETE' ? 'danger' : 'warning'
                                        }
                                        className="text-[9px] uppercase font-black px-1.5 py-0 min-w-[60px] inline-flex justify-center"
                                    >
                                        {log.action}
                                    </Badge>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-[10px] font-bold text-primary-600">
                                            {log.user?.name?.charAt(0) || <User size={10} />}
                                        </div>
                                        <span className="text-xs text-surface-text font-medium">
                                            {log.user?.name || 'System'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <div className="flex flex-col items-end opacity-60 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[11px] font-bold text-surface-text flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="text-[9px] text-surface-muted font-bold uppercase tracking-tight">
                                            {new Date(log.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/10 border border-primary-100/50 dark:border-primary-800/30 flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600">
                    <Info size={16} />
                </div>
                <div>
                    <h5 className="text-[10px] font-black text-primary-700 dark:text-primary-400 uppercase tracking-widest">Compliance Oversight</h5>
                    <p className="text-[11px] text-primary-900/70 dark:text-primary-100/60 mt-0.5 leading-relaxed">
                        These logs are cryptographically hashed and stored in your enterprise vault. They fulfill ISO-27001 requirements for administrative traceability.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
