import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getExecutiveBriefing } from '../../services/ai';
import {
    Zap,
    Target,
    ArrowRight,
    TrendingUp,
    Clock,
    Loader2,
    ShieldAlert,
    type LucideIcon
} from 'lucide-react';
import { Card } from '../UI/Card';

interface BriefingItem {
    id: string;
    type: 'critical' | 'opportunity' | 'warning';
    title: string;
    description: string;
    action: string;
}

const typeConfig: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
    opportunity: { icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    warning: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    critical: { icon: TrendingUp, color: "text-primary-500", bg: "bg-primary-500/10" }
};

const ExecutiveBriefing: React.FC = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['executive-briefing'],
        queryFn: getExecutiveBriefing,
        refetchInterval: 1000 * 60 * 10, // 10 minutes
    });

    if (isLoading) {
        return (
            <Card className="min-h-[400px] flex items-center justify-center">
                <div className="text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
                    <p className="text-xs font-bold text-surface-muted uppercase tracking-widest">IA Generando Estrategia...</p>
                </div>
            </Card>
        );
    }

    const items: BriefingItem[] = data?.items || [];

    return (
        <Card className="premium-shadow shrink-0">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-bold text-surface-text tracking-tight flex items-center gap-3 uppercase tracking-wider">
                        <Zap size={20} className="text-primary-500 fill-primary-500/20" />
                        Briefing Ejecutivo
                    </h3>
                    <p className="text-[10px] font-black text-surface-muted uppercase tracking-widest mt-1">Sugerencias de IA en tiempo real</p>
                </div>
            </div>

            <div className="space-y-4">
                {items.length > 0 ? items.map((item, idx) => {
                    const config = typeConfig[item.type] || typeConfig.opportunity;
                    const Icon = config.icon;

                    return (
                        <motion.div
                            key={item.id || idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group relative p-5 rounded-2xl border border-surface-border hover:bg-surface-hover transition-all cursor-pointer"
                        >
                            <div className="flex gap-4">
                                <div className={`w-10 h-10 rounded-xl ${config.bg} ${config.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                    <Icon size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-bold text-surface-text text-sm tracking-tight">{item.title}</h4>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${config.color}`}>{item.type}</span>
                                    </div>
                                    <p className="text-xs text-surface-muted font-medium leading-relaxed mb-3">
                                        {item.description}
                                    </p>
                                    <button className="flex items-center gap-2 text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest group-hover:gap-3 transition-all">
                                        {item.action}
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                }) : (
                    <div className="py-12 text-center opacity-50">
                        <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-surface-muted/50" />
                        <p className="text-xs font-bold text-surface-muted uppercase tracking-widest">Sin sugerencias estratégicas actuales</p>
                    </div>
                )}
            </div>

            <button className="w-full mt-6 py-4 rounded-xl bg-surface-muted-bg text-surface-muted text-[10px] font-black uppercase tracking-widest hover:text-primary-500 hover:bg-primary-500/10 transition-all border border-transparent hover:border-primary-500/20">
                Ver Análisis Completo
            </button>
        </Card>
    );
};

export default ExecutiveBriefing;
