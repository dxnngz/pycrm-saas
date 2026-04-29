import React, { forwardRef } from 'react';
import { useUI } from '../../hooks/useUI';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, icon, className = '', children, ...props }, ref) => {
        const { isDense } = useUI();
        return (
            <div className="w-full space-y-1 focus-within:z-10">
                {label && (
                <label className="block text-[11px] font-bold text-surface-muted uppercase tracking-wider pl-0.5">
                        {label}
                    </label>
                )
                }
                <div className="relative group">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted group-focus-within:text-primary-500 transition-colors pointer-events-none">
                            {icon}
                        </div>
                    )}
                    <select
                        ref={ref}
                        className={`
                            w-full ${isDense ? 'h-8 px-2.5' : 'h-10 px-3'} bg-surface-input
                            border ${error ? 'border-red-500' : 'border-surface-border'}
                            rounded-md ${icon ? 'pl-9' : (isDense ? 'px-2.5' : 'px-3')} pr-10
                            text-sm text-surface-text
                            appearance-none cursor-pointer
                            focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500/10' : 'focus:ring-primary-500/10'}
                            focus:border-primary-500 transition-all shadow-sm
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${className}
                        `}
                        {...props}
                    >
                        {children}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-surface-muted">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
                {error && <p className="text-[10px] font-medium text-red-500 mt-1 pl-0.5">{error}</p>}
            </div>
        );
    }
);

Select.displayName = 'Select';
