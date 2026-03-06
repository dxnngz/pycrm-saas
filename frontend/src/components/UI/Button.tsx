import React from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className = '',
            variant = 'primary',
            size = 'md',
            isLoading = false,
            fullWidth = false,
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        // Base classes
        const baseClasses =
            'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none';

        // Variants
        const variants = {
            primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm border border-primary-700/50',
            secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700/50 shadow-sm',
            outline: 'border border-slate-200 bg-transparent hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:hover:bg-slate-800/50 dark:text-slate-300',
            ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800/50',
            danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm border border-red-700/50',
        };

        // Sizes
        const sizes = {
            sm: 'h-8 px-3 text-xs',
            md: 'h-10 px-4 py-2 text-sm',
            lg: 'h-12 px-6 text-base',
        };

        const classes = [
            baseClasses,
            variants[variant],
            sizes[size],
            fullWidth ? 'w-full' : '',
            className,
        ].filter(Boolean).join(' ');

        return (
            <button
                ref={ref}
                className={classes}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
