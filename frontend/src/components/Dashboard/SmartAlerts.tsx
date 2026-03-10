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
            <Card className="h-full flex items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-900/50">
                <Loader2 className="w-5 h-5 text-primary-500 animate-spin mr-2" />
                <span className="text-xs text-slate-500 font-medium italic">IA analizando pipeline...</span>
            </Card>
        );
    }

    const alerts = data?.alerts || [];

    if (alerts.length === 0) {
        return (
            <Card className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60 border-dashed">
                <ShieldAlert className="w-6 h-6 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-[11px] text-slate-500 font-medium">No se detectaron riesgos críticos.</p>
            </Card>
        );
    }

    return (
        <Card className="h-full space-y-3">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">Smart Intelligence</h3>
                    <p className="text-[9px] text-slate-500 font-bold mt-0.5 uppercase tracking-tight">AI-driven risk & opportunity mapping</p>
                </div>
                <Badge variant="secondary">{alerts.length}</Badge>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[400px] pr-1">
                <AnimatePresence>
                    {alerts.map((alert: { type: string; title: string; impact: string; description: string }, idx: number) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`p-3 rounded-lg border flex gap-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${alert.type === 'WARNING'
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
                                    <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{alert.title}</span>
                                    {alert.impact === 'HIGH' && (
                                        <span className="px-1 py-0.5 rounded-[4px] text-[8px] font-black bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 uppercase">Prioridad</span>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-2">{alert.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </Card>
    );
};

export default SmartAlerts;
