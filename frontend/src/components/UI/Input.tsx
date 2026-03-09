import React from 'react';
import type { InputHTMLAttributes } from 'react';
import { useUI } from '../../context/UIContext';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    helperText?: string;
    error?: string;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className = '',
            label,
            helperText,
            error,
            icon,
            iconPosition = 'left',
            type = 'text',
            id,
            ...props
        },
        ref
    ) => {
        const { isDense } = useUI();
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className={`block mb-1 ${isDense ? 'text-[10px]' : 'text-[11px]'} font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider`}
                    >
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <div className="relative">
                    {icon && iconPosition === 'left' && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: isDense ? 14 : 16 }) : icon}
                        </div>
                    )}
                    <input
                        id={inputId}
                        ref={ref}
                        type={type}
                        className={`
                            glass-input block w-full rounded-xl text-sm transition-all
                            placeholder-slate-400 dark:placeholder-slate-500
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
                            ${icon && iconPosition === 'left' ? 'pl-10' : 'pl-4'}
                            ${icon && iconPosition === 'right' ? 'pr-10' : 'pr-4'}
                            ${isDense ? 'py-2 px-3' : 'py-3'}
                            ${className}
                        `}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
                        {...props}
                    />
                    {icon && iconPosition === 'right' && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
                            {icon}
                        </div>
                    )}
                </div>
                {error && (
                    <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-500 font-medium">
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
