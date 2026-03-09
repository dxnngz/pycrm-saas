import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface DropdownOption {
    id: string;
    label: string;
    icon?: React.ReactNode;
    variant?: 'default' | 'danger';
}

interface DropdownProps {
    trigger: React.ReactNode;
    options: DropdownOption[];
    onSelect: (option: DropdownOption) => void;
    align?: 'left' | 'right';
    className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
    trigger,
    options,
    onSelect,
    align = 'right',
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className={`
                            absolute z-50 mt-1 w-48 rounded-md shadow-lg 
                            bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800
                            ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden
                            ${align === 'right' ? 'right-0' : 'left-0'}
                        `}
                    >
                        <div className="py-1">
                            {options.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        onSelect(option);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        flex items-center w-full px-4 py-2 text-[13px] font-medium transition-colors
                                        ${option.variant === 'danger'
                                            ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10'
                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}
                                    `}
                                >
                                    {option.icon && <span className="mr-2 opacity-70">{option.icon}</span>}
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
