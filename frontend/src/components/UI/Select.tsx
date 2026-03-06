import React, { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, icon, className = '', children, ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5 focus-within:z-10">
                {label && (
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-0.5">
                        {label}
                    </label>
                )
                }
                <div className="relative group">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors pointer-events-none">
                            {icon}
                        </div>
                    )}
                    <select
                        ref={ref}
                        className={`
                            w-full h-10 bg-white dark:bg-slate-900 
                            border ${error ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}
                            rounded-md px-3 ${icon ? 'pl-9' : 'pl-3'} pr-10
                            text-sm text-slate-900 dark:text-slate-100
                            appearance-none cursor-pointer
                            focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500/20' : 'focus:ring-primary-500/20'} 
                            focus:border-primary-500 transition-all shadow-sm
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${className}
                        `}
                        {...props}
                    >
                        {children}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
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
