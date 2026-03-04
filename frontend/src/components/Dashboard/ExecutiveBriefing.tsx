import React from 'react';
import { motion } from 'framer-motion';
import {
    Zap,
    Target,
    ArrowRight,
    TrendingUp,
    Clock
} from 'lucide-react';

interface BriefingItem {
    id: string;
    type: 'critical' | 'opportunity' | 'warning';
    title: string;
    description: string;
    action: string;
    icon: any;
    color: string;
    bg: string;
}

const ExecutiveBriefing: React.FC = () => {
    const items: BriefingItem[] = [
        {
            id: '1',
            type: 'opportunity',
            title: "Cierre de Alta Probabilidad",
            description: "Propuesta 'Seguridad Cloud' para Inditex tiene 85% de probabilidad de éxito.",
            action: "Enviar Contrato Final",
            icon: Target,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
        },
        {
            id: '2',
            type: 'warning',
            title: "Atención Requerida",
            description: "La cuenta de 'Telefónica' no ha tenido actividad en los últimos 7 días.",
            action: "Programar Seguimiento",
            icon: Clock,
            color: "text-amber-500",
            bg: "bg-amber-500/10"
        },
        {
            id: '3',
            type: 'critical',
            title: "Hito de Facturación",
            description: "Estás a 12.000€ de superar el objetivo del Q1.",
            action: "Ver Pipeline",
            icon: TrendingUp,
            color: "text-primary-500",
            bg: "bg-primary-500/10"
        }
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow h-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Zap size={28} className="text-primary-500 fill-primary-500/20" />
                        Briefing Ejecutivo
                    </h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Sugerencias de IA en tiempo real</p>
                </div>
            </div>

            <div className="space-y-4">
                {items.map((item, idx) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group relative p-5 rounded-3xl border border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                        <div className="flex gap-4">
                            <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                <item.icon size={22} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">{item.title}</h4>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${item.color}`}>{item.type}</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-3">
                                    {item.description}
                                </p>
                                <button className="flex items-center gap-2 text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest group-hover:gap-3 transition-all">
                                    {item.action}
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <button className="w-full mt-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-primary-500 hover:bg-primary-500/10 transition-all border border-transparent hover:border-primary-500/20">
                Ver Análisis Completo
            </button>
        </div>
    );
};

export default ExecutiveBriefing;
