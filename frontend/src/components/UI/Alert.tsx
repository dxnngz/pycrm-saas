import React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { useUI } from '../../hooks/useUI';

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
    const { isDense } = useUI();
    const variants = {
        success: {
            bg: 'bg-success-bg',
            border: 'border-success-border',
            text: 'text-success-text',
            icon: <CheckCircle2 size={18} className="text-success-icon" />
        },
        danger: {
            bg: 'bg-danger-bg',
            border: 'border-danger-border',
            text: 'text-danger-text',
            icon: <XCircle size={18} className="text-danger-icon" />
        },
        warning: {
            bg: 'bg-warning-bg',
            border: 'border-warning-border',
            text: 'text-warning-text',
            icon: <AlertCircle size={18} className="text-warning-icon" />
        },
        info: {
            bg: 'bg-info-bg',
            border: 'border-info-border',
            text: 'text-info-text',
            icon: <Info size={18} className="text-info-icon" />
        }
    };

    const style = variants[variant];

    return (
        <div className={`
            ${isDense ? 'p-2.5' : 'p-3'} rounded-md border flex gap-3
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
