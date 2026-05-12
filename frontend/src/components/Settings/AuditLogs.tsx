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
import { formatDate, formatTime } from '../../utils/format';
import { customFetch, getHeaders, handleResponse } from '../../services/apiClient';

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
            const res = await customFetch('/audit', { headers: getHeaders() });
            return handleResponse(res);
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
                        Registro de actividad
                    </h3>
                    <p className="text-[10px] text-surface-muted font-bold uppercase mt-1">Registro inmutable de acciones del sistema</p>
                </div>
                <Badge variant="info" className="text-[9px] px-2 py-0.5 border-surface-border">
                    Retención: 90 días
                </Badge>
            </div>

            <div className="bg-surface-muted-bg/40 rounded-xl border border-surface-border overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-surface-border bg-surface-card/50">
                            <th className="px-4 py-3 text-[10px] font-bold text-surface-muted uppercase tracking-widest">Evento</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-surface-muted uppercase tracking-widest text-center">Acción</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-surface-muted uppercase tracking-widest">Usuario</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-surface-muted uppercase tracking-widest text-right">Fecha</th>
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
                                                {log.changes ? JSON.stringify(log.changes) : 'Sin detalles'}
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
                                        <div className="w-6 h-6 rounded bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-[10px] font-bold text-primary-600">
                                            {log.user?.name?.charAt(0) || <User size={10} />}
                                        </div>
                                        <span className="text-xs text-surface-text font-medium">
                                            {log.user?.name || 'Sistema'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <div className="flex flex-col items-end opacity-60 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[11px] font-bold text-surface-text flex items-center gap-1">
                                            <Clock size={10} />
                                            {formatTime(log.created_at)}
                                        </span>
                                        <span className="text-[9px] text-surface-muted font-bold uppercase tracking-tight">
                                            {formatDate(log.created_at)}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-4 rounded-xl bg-info-bg border border-info-border flex items-start gap-4">
                <div className="p-2 rounded-lg bg-surface-card border border-info-border text-info-icon">
                    <Info size={16} />
                </div>
                <div>
                    <h5 className="text-[10px] font-black text-info-text uppercase tracking-widest">Cumplimiento</h5>
                    <p className="text-[11px] text-surface-text/70 mt-0.5 leading-relaxed">
                        Estos registros se almacenan de forma segura y sirven para trazabilidad administrativa. Útiles para auditorías y control interno.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
