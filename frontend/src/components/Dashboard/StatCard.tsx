import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string;
    icon: ReactNode;
    trend?: string;
    trendUp?: boolean;
    color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp, color }) => {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="glass-card p-6 rounded-3xl relative overflow-hidden group transition-all"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-transparent -mr-16 -mt-16 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`p-3 rounded-2xl bg-${color || 'primary'}-500/10 dark:bg-${color || 'primary'}-500/20 text-${color || 'primary'}-600 dark:text-${color || 'primary'}-400`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-500' : 'text-rose-500'} bg-white/50 dark:bg-slate-950/50 px-2 py-1 rounded-lg border border-white/20`}>
                        {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {trend}
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">{title}</h3>
                <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
            </div>
        </motion.div>
    );
};

export default StatCard;
