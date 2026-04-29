import type { FC } from 'react';
import { BrainCircuit, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIBannerProps {
    forecast: { value: number; growth: number } | null;
    monthsAnalyzed: number;
}

const AIBanner: FC<AIBannerProps> = ({ forecast, monthsAnalyzed }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-card border border-surface-border p-1 rounded-[3rem] shadow-2xl overflow-hidden relative group"
        >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            <div className="bg-surface-card/80 backdrop-blur-3xl rounded-[2.9rem] p-10 flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
                <div className="flex items-center gap-8">
                    <div className="w-24 h-24 bg-primary-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-primary-600/50 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
                        <BrainCircuit size={48} className="text-white relative z-10" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-primary-400 text-[10px] font-black uppercase tracking-[0.3em]">Predicción de Mercado</span>
                            <div className="h-1 w-1 rounded-full bg-primary-500 animate-pulse"></div>
                        </div>
                        <h3 className="text-3xl font-black text-surface-text tracking-tight">
                            Pronóstico de Ventas: <span className="text-primary-400">{forecast?.value.toLocaleString()} €</span>
                        </h3>
                        <p className="text-surface-muted font-bold mt-1 text-sm">
                            Basado en el comportamiento histórico de tus últimos {monthsAnalyzed} meses.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-12 border-l border-surface-border/60 pl-12 h-20">
                    <div className="text-center">
                        <p className="text-surface-muted text-[10px] font-black uppercase tracking-widest mb-1">Crecimiento IA</p>
                        <div className={`flex items-center gap-2 text-2xl font-black ${forecast && forecast.growth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {forecast && forecast.growth >= 0 ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                            {forecast?.growth}%
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-surface-muted text-[10px] font-black uppercase tracking-widest mb-1">Confianza</p>
                        <p className="text-surface-text text-2xl font-black">94.2%</p>
                    </div>
                    <div className="text-center">
                        <p className="text-surface-muted text-[10px] font-black uppercase tracking-widest mb-1">Status</p>
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase border border-emerald-500/30">
                            Optimizado
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AIBanner;
