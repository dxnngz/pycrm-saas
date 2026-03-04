import React, { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: React.ReactNode;
    error?: string;
    helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, icon, error, helperText, type, className = '', ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const [isFocused, setIsFocused] = useState(false);
        const isPassword = type === 'password';
        const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

        const hasValue = props.value !== undefined && props.value !== '';

        return (
            <div className="w-full space-y-1.5">
                <div className="relative group">
                    {/* Icon Container */}
                    {icon && (
                        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${error ? 'text-rose-500' : isFocused ? 'text-primary-500' : 'text-slate-400 group-hover:text-slate-500'
                            }`}>
                            {icon}
                        </div>
                    )}

                    {/* Input Field */}
                    <input
                        {...props}
                        ref={ref}
                        type={inputType}
                        onFocus={(e) => {
                            setIsFocused(true);
                            props.onFocus?.(e);
                        }}
                        onBlur={(e) => {
                            setIsFocused(false);
                            props.onBlur?.(e);
                        }}
                        className={`
                            peer w-full bg-slate-50 dark:bg-slate-900/50 
                            border-2 rounded-2xl outline-none transition-all duration-200
                            ${icon ? 'pl-12' : 'pl-4'} pr-12 pt-6 pb-2
                            ${error
                                ? 'border-rose-500/50 focus:border-rose-500 dark:border-rose-500/30'
                                : 'border-slate-100 dark:border-slate-800 focus:border-primary-500 dark:focus:border-primary-500'
                            }
                            placeholder-transparent font-medium dark:text-white
                            ${className}
                        `}
                    />

                    {/* Floating Label */}
                    <label
                        className={`
                            absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-200
                            ${icon ? 'left-12' : 'left-4'}
                            ${(isFocused || hasValue)
                                ? 'text-[10px] font-black uppercase tracking-widest -translate-y-[18px] opacity-100'
                                : 'text-sm font-bold text-slate-400 opacity-60'
                            }
                            ${error ? 'text-rose-500' : isFocused ? 'text-primary-500' : 'text-slate-400'}
                        `}
                    >
                        {label}
                    </label>

                    {/* Action Buttons (Password Toggle) */}
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    )}

                    {/* Error Icon */}
                    {error && !isPassword && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500">
                            <AlertCircle size={18} />
                        </div>
                    )}
                </div>

                {/* Validation Messages / Helper Text */}
                <AnimatePresence>
                    {error ? (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            aria-live="polite"
                            className="text-[11px] font-bold text-rose-500 pl-4 flex items-center gap-1.5"
                        >
                            <AlertCircle size={12} />
                            {error}
                        </motion.p>
                    ) : helperText ? (
                        <p className="text-[11px] font-medium text-slate-400 pl-4">
                            {helperText}
                        </p>
                    ) : null}
                </AnimatePresence>
            </div>
        );
    }
);

Input.displayName = 'Input';
