import React from 'react';
import { motion } from 'framer-motion';

interface PerformanceListProps {
    performance: Array<{
        id: number | string;
        name: string;
        total_sales: number;
    }>;
}

export const PerformanceList: React.FC<PerformanceListProps> = ({ performance }) => {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 h-full shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider">Sales Performance</h3>
            <div className="space-y-6">
                {performance.map((rep) => (
                    <div key={rep.id} className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-slate-600 dark:text-slate-400">{rep.name}</span>
                            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(rep.total_sales)}
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (rep.total_sales / 60000) * 100)}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="h-full bg-primary-600 rounded-full"
                            />
                        </div>
                    </div>
                ))}
                {performance.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-10">No performance data available.</p>
                )}
            </div>
        </div>
    );
};
