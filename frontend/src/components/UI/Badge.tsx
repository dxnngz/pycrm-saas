import React from 'react';
import type { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className = '', variant = 'default', children, ...props }, ref) => {
        const variants = {
            default: 'bg-surface-muted-bg text-surface-text border-surface-border',
            success: 'bg-success-bg text-success-text border-success-border',
            warning: 'bg-warning-bg text-warning-text border-warning-border',
            danger: 'bg-danger-bg text-danger-text border-danger-border',
            info: 'bg-info-bg text-info-text border-info-border',
            secondary: 'bg-surface-muted-bg text-surface-text border-surface-border',
        };

        return (
            <span
                ref={ref}
                className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${variants[variant]} ${className}`}
                {...props}
            >
                {children}
            </span>
        );
    }
);

Badge.displayName = 'Badge';
