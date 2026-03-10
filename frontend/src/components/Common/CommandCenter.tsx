import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Command,
    Plus,
    Users,
    Target,
    CheckSquare,
    FileText,
    Settings,
    ArrowRight,
    Zap,
    type LucideIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface CommandCenterItem {
    id: string;
    label: string;
    icon: LucideIcon;
    color?: string;
    bg?: string;
}

interface CommandCenterProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: string) => void;
}

const QUICK_ACTIONS: CommandCenterItem[] = [
    { id: 'new-client', label: 'Create New Customer', icon: Plus, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'new-opp', label: 'New Sales Opportunity', icon: Target, color: 'text-primary-500', bg: 'bg-primary-500/10' },
    { id: 'new-task', label: 'Assign Priority Task', icon: CheckSquare, color: 'text-amber-500', bg: 'bg-amber-500/10' },
];

const NAVIGATION: CommandCenterItem[] = [
    { id: 'dashboard', label: 'Go to Dashboard', icon: Command, color: 'text-slate-400', bg: 'bg-slate-100' },
    { id: 'contacts', label: 'Manage Customers', icon: Users, color: 'text-slate-400', bg: 'bg-slate-100' },
    { id: 'pipeline', label: 'Sales Pipeline', icon: Target, color: 'text-slate-400', bg: 'bg-slate-100' },
    { id: 'tasks', label: 'Global Task Manager', icon: CheckSquare, color: 'text-slate-400', bg: 'bg-slate-100' },
    { id: 'documents', label: 'Vault & Documents', icon: FileText, color: 'text-slate-400', bg: 'bg-slate-100' },
    { id: 'settings', label: 'Access Settings', icon: Settings, color: 'text-slate-400', bg: 'bg-slate-100' },
];

export const CommandCenter: React.FC<CommandCenterProps> = ({ isOpen, onClose, onNavigate }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const allItems = [...QUICK_ACTIONS, ...NAVIGATION].filter(item =>
        (item.label ?? '').toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleAction = useCallback((item: CommandCenterItem) => {
        if (item.id.startsWith('new-')) {
            toast.info(`Action '${item.label}' will open in a creation modal.`);
        } else {
            onNavigate(item.id);
        }
        onClose();
    }, [onNavigate, onClose]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % allItems.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const selected = allItems[selectedIndex];
                if (selected) handleAction(selected);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, allItems, handleAction, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -10 }}
                        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                    >
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                            <Search size={18} className="text-slate-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search commands, customers, or actions..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">ESC</span>
                            </div>
                        </div>

                        <div className="max-h-[50vh] overflow-y-auto p-2 custom-scrollbar">
                            {allItems.length > 0 ? (
                                <div className="space-y-4">
                                    {/* Quick Actions Section */}
                                    {allItems.some(i => i.id.startsWith('new-')) && (
                                        <div className="space-y-1">
                                            <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quick Actions</p>
                                            <div className="space-y-0.5">
                                                {allItems.filter(i => i.id.startsWith('new-')).map((item) => {
                                                    const globalIdx = allItems.indexOf(item);
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => handleAction(item)}
                                                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                                                            className={`w-full flex items-center justify-between p-2 rounded-md transition-all group ${selectedIndex === globalIdx ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-md flex items-center justify-center border border-slate-200 dark:border-slate-700 ${selectedIndex === globalIdx ? 'bg-white dark:bg-slate-900 shadow-sm' : 'bg-slate-50 dark:bg-slate-900'}`}>
                                                                    <item.icon size={14} className={item.color} />
                                                                </div>
                                                                <span className={`text-sm font-medium ${selectedIndex === globalIdx ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{item.label}</span>
                                                            </div>
                                                            <div className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase ${selectedIndex === globalIdx ? 'bg-primary-50 border-primary-100 text-primary-600' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>Action</div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Navigation Section */}
                                    {allItems.some(i => !i.id.startsWith('new-')) && (
                                        <div className="space-y-1">
                                            <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Navigation</p>
                                            <div className="space-y-0.5">
                                                {allItems.filter(i => !i.id.startsWith('new-')).map((item) => {
                                                    const globalIdx = allItems.indexOf(item);
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => handleAction(item)}
                                                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                                                            className={`w-full flex items-center justify-between p-2 rounded-md transition-all group ${selectedIndex === globalIdx ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-md flex items-center justify-center border border-slate-200 dark:border-slate-700 ${selectedIndex === globalIdx ? 'bg-white dark:bg-slate-900 shadow-sm' : 'bg-slate-50 dark:bg-slate-900'}`}>
                                                                    <item.icon size={14} className="text-slate-400" />
                                                                </div>
                                                                <span className={`text-sm font-medium ${selectedIndex === globalIdx ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{item.label}</span>
                                                            </div>
                                                            <ArrowRight size={14} className={`text-slate-400 transition-transform ${selectedIndex === globalIdx ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`} />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-50 dark:bg-slate-800 text-slate-300 rounded-lg mb-4 border border-slate-200 dark:border-slate-700">
                                        <Zap size={24} />
                                    </div>
                                    <p className="text-slate-500 text-sm font-medium">No results found for "{query}"</p>
                                    <p className="text-[11px] text-slate-400 mt-1">Try searching for 'Panel', 'Contacts' or 'New Action'</p>
                                </div>
                            )}
                        </div>

                        <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm text-slate-500">↑↓</kbd>
                                    Navigate
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm text-slate-500">Enter</kbd>
                                    Select
                                </div>
                            </div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                PyCRM Command Center
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
