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

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp, color = 'primary' }) => {
    const colorClasses: Record<string, string> = {
        primary: 'bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400',
        indigo: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
        emerald: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
        amber: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
    };

    const currentColors = colorClasses[color] || colorClasses.primary;

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="glass-card p-6 rounded-3xl relative overflow-hidden group transition-all"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-transparent -mr-16 -mt-16 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`p-3 rounded-2xl ${currentColors}`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-500' : 'text-rose-500'} bg-surface-muted-bg/50 px-2 py-1 rounded-lg border border-surface-border/20`}>
                        {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {trend}
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <h3 className="text-sm font-semibold text-surface-muted mb-1">{title}</h3>
                <p className="text-3xl font-bold text-surface-text tracking-tight">{value}</p>
            </div>
        </motion.div>
    );
};

export default StatCard;
