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
        <div className="bg-surface-card border border-surface-border rounded-lg shadow-sm h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-surface-border bg-surface-muted-bg/50">
                <h3 className="text-[11px] font-bold text-surface-text uppercase tracking-wider flex items-center gap-2">
                    <Users size={14} className="text-primary-600 dark:text-primary-400" />
                    Commercial Performance
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-surface-border/50">
                {performance.map((rep) => (
                    <div key={rep.id} className="p-4 hover:bg-surface-hover transition-colors">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-surface-muted">{rep.name}</span>
                            <span className="text-[11px] font-bold text-surface-text tabular-nums bg-surface-muted-bg px-2 py-0.5 rounded">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(rep.total_sales)}
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-muted-bg rounded-full overflow-hidden border border-surface-border/50">
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
                <div className="flex-1 flex items-center justify-center p-8 text-surface-muted opacity-60 italic text-[10px]">
                    No performance metrics recorded for this period.
                </div>
            )}
        </div>
    );
};
