import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

interface PerformanceListProps {
    performance: Array<{
        id: number | string;
        name: string;
        total_sales: number;
    }>;
}

export const PerformanceList: React.FC<PerformanceListProps> = ({ performance }) => {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Users size={14} className="text-primary-600 dark:text-primary-400" />
                    Commercial Performance
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                {performance.map((rep) => (
                    <div key={rep.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{rep.name}</span>
                            <span className="text-[11px] font-bold text-slate-900 dark:text-white tabular-nums bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(rep.total_sales)}
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (rep.total_sales / 60000) * 100)}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="h-full bg-primary-600 rounded-full"
                            />
                        </div>
                    </div>
                ))}
            </div>
            {performance.length === 0 && (
                <div className="flex-1 flex items-center justify-center p-8 text-slate-400 opacity-60 italic text-[10px]">
                    No performance metrics recorded for this period.
                </div>
            )}
        </div>
    );
};
