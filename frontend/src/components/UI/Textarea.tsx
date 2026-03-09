import React, { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, className = '', ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5 focus-within:z-10">
                {label && (
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-0.5">
                        {label}
                    </label>
                )
                }
                <textarea
                    ref={ref}
                    className={`
                        w-full bg-white dark:bg-slate-900 
                        border ${error ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}
                        rounded-md p-2.5 text-sm text-slate-900 dark:text-slate-100
                        placeholder:text-slate-400 dark:placeholder:text-slate-600
                        focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500/10' : 'focus:ring-primary-500/10'} 
                        focus:border-primary-500 transition-all shadow-sm
                        disabled:opacity-50 disabled:cursor-not-allowed
                        min-h-[80px] resize-y
                        ${className}
                    `}
                    {...props}
                />
                {error && <p className="text-[10px] font-medium text-red-500 mt-1 pl-0.5">{error}</p>}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';
