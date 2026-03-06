import type { ReactNode } from 'react';

interface StatCardProps {
    title: string;
    value: string;
    icon: ReactNode;
    trend: string;
    trendColor?: 'success' | 'danger' | 'warning' | 'neutral';
}

const StatCard = ({ title, value, icon, trend, trendColor = 'success' }: StatCardProps) => {
    const trendColors = {
        success: 'text-emerald-600 dark:text-emerald-400',
        danger: 'text-rose-600 dark:text-rose-400',
        warning: 'text-amber-600 dark:text-amber-400',
        neutral: 'text-slate-400',
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                    {icon}
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${trendColors[trendColor]}`}>
                    {trend}
                </div>
            </div>
            <div>
                <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">{title}</h3>
                <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;
