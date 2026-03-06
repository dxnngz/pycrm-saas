import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../UI/Button';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description: string;
    icon: LucideIcon;
    actionLabel?: string;
    onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon: Icon,
    actionLabel,
    onAction
}) => {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-6">
                <Icon size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-8">
                {description}
            </p>
            {actionLabel && onAction && (
                <Button variant="primary" onClick={onAction}>
                    <Plus size={18} className="mr-2" />
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};
