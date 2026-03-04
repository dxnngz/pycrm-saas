import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
    title: string;
    value: string;
    icon: ReactNode;
    trend: string;
    color: 'primary' | 'emerald' | 'amber' | 'indigo';
}

const StatCard = ({ title, value, icon, trend, color }: StatCardProps) => {
    const colors = {
        primary: 'bg-primary-500 text-primary-500',
        emerald: 'bg-emerald-500 text-emerald-500',
        amber: 'bg-amber-500 text-amber-500',
        indigo: 'bg-indigo-500 text-indigo-500',
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow group"
        >
            <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:${colors[color]} group-hover:bg-opacity-10 transition-all duration-300`}>
                    {icon}
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-black">
                    {trend}
                </div>
            </div>
            <h3 className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-[0.2em] mb-2">{title}</h3>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">{value}</p>
        </motion.div>
    );
};

export default StatCard;
