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
                    <label className="block text-[11px] font-bold text-surface-muted uppercase tracking-wider pl-0.5">
                        {label}
                    </label>
                )
                }
                <textarea
                    ref={ref}
                    className={`
                        w-full bg-surface-input
                        border ${error ? 'border-red-500' : 'border-surface-border'}
                        rounded-md p-2.5 text-sm text-surface-text
                        placeholder:text-surface-muted
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
