import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSmartAlerts } from '../../services/ai';
import { AlertCircle, Lightbulb, Loader2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../UI/Card';
import { Badge } from '../UI/Badge';

const SmartAlerts: React.FC = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['smart-alerts'],
        queryFn: getSmartAlerts,
        refetchInterval: 1000 * 60 * 5,
    });

    if (isLoading) {
        return (
            <Card className="flex items-center justify-center p-8 bg-surface-muted-bg/50 shrink-0">
                <Loader2 className="w-5 h-5 text-primary-500 animate-spin mr-2" />
                <span className="text-xs text-surface-muted font-medium italic">IA analizando pipeline...</span>
            </Card>
        );
    }

    const alerts = data?.alerts || [];

    if (alerts.length === 0) {
        return (
            <Card className="flex flex-col items-center justify-center text-center p-8 opacity-60 border-dashed shrink-0">
                <ShieldAlert className="w-6 h-6 text-surface-muted mx-auto mb-2" />
                <p className="text-[11px] text-surface-muted font-medium">No se detectaron riesgos críticos.</p>
            </Card>
        );
    }

    return (
        <Card className="space-y-3 shrink-0">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-[11px] font-bold text-surface-text uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldAlert size={12} className="text-primary-500" />
                        Armor Status
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[9px] text-surface-muted font-bold uppercase tracking-tight">Self-Healing Active</p>
                    </div>
                </div>
                <Badge variant="success">Optimal</Badge>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[400px] pr-1">
                <AnimatePresence>
                    {alerts.map((alert: { type: string; title: string; impact: string; description: string }, idx: number) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`p-3 rounded-lg border flex gap-3 transition-all hover:bg-surface-hover ${alert.type === 'WARNING'
                                ? 'bg-red-50/30 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
                                : 'bg-primary-50/30 dark:bg-primary-900/10 border-primary-100 dark:border-primary-900/30'
                                }`}
                        >
                            <div className={`mt-0.5 w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${alert.type === 'WARNING' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                                }`}>
                                {alert.type === 'WARNING' ? <AlertCircle size={14} /> : <Lightbulb size={14} />}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[11px] font-bold text-surface-text truncate">{alert.title}</span>
                                    {alert.impact === 'HIGH' && (
                                        <span className="px-1 py-0.5 rounded-[4px] text-[8px] font-black bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 uppercase">Prioridad</span>
                                    )}
                                </div>
                                <p className="text-[10px] text-surface-muted leading-relaxed font-medium line-clamp-2">{alert.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </Card>
    );
};

export default SmartAlerts;
