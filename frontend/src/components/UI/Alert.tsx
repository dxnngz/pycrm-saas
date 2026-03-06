import React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

interface AlertProps {
    variant?: 'success' | 'danger' | 'warning' | 'info';
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export const Alert: React.FC<AlertProps> = ({
    variant = 'info',
    title,
    children,
    className = ''
}) => {
    const variants = {
        success: {
            bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            border: 'border-emerald-200 dark:border-emerald-500/20',
            text: 'text-emerald-800 dark:text-emerald-400',
            icon: <CheckCircle2 size={18} className="text-emerald-500" />
        },
        danger: {
            bg: 'bg-red-50 dark:bg-red-500/10',
            border: 'border-red-200 dark:border-red-500/20',
            text: 'text-red-800 dark:text-red-400',
            icon: <XCircle size={18} className="text-red-500" />
        },
        warning: {
            bg: 'bg-amber-50 dark:bg-amber-500/10',
            border: 'border-amber-200 dark:border-amber-500/20',
            text: 'text-amber-800 dark:text-amber-400',
            icon: <AlertCircle size={18} className="text-amber-500" />
        },
        info: {
            bg: 'bg-blue-50 dark:bg-blue-500/10',
            border: 'border-blue-200 dark:border-blue-500/20',
            text: 'text-blue-800 dark:text-blue-400',
            icon: <Info size={18} className="text-blue-500" />
        }
    };

    const style = variants[variant];

    return (
        <div className={`
            p-4 rounded-lg border flex gap-3
            ${style.bg} ${style.border} ${style.text}
            ${className}
        `} role="alert">
            <div className="shrink-0 pt-0.5">
                {style.icon}
            </div>
            <div className="flex-1 space-y-1">
                {title && <h5 className="font-bold text-sm leading-none">{title}</h5>}
                <div className="text-xs font-medium opacity-90 leading-relaxed">
                    {children}
                </div>
            </div>
        </div>
    );
};
