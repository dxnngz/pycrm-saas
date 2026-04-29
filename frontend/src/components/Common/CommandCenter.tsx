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
    { id: 'dashboard', label: 'Go to Dashboard', icon: Command, color: 'text-surface-muted', bg: 'bg-surface-muted-bg' },
    { id: 'contacts', label: 'Manage Customers', icon: Users, color: 'text-surface-muted', bg: 'bg-surface-muted-bg' },
    { id: 'pipeline', label: 'Sales Pipeline', icon: Target, color: 'text-surface-muted', bg: 'bg-surface-muted-bg' },
    { id: 'tasks', label: 'Global Task Manager', icon: CheckSquare, color: 'text-surface-muted', bg: 'bg-surface-muted-bg' },
    { id: 'documents', label: 'Vault & Documents', icon: FileText, color: 'text-surface-muted', bg: 'bg-surface-muted-bg' },
    { id: 'settings', label: 'Access Settings', icon: Settings, color: 'text-surface-muted', bg: 'bg-surface-muted-bg' },
];

export const CommandCenter: React.FC<CommandCenterProps> = ({ isOpen, onClose, onNavigate }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const allItems = [...QUICK_ACTIONS, ...NAVIGATION].filter(item =>
        (item.label ?? '').toLowerCase().includes((query ?? '').toLowerCase())
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
                        className="fixed inset-0 bg-surface-text/60 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -10 }}
                        className="relative w-full max-w-xl bg-surface-card rounded-lg shadow-2xl border border-surface-border overflow-hidden"
                    >
                        <div className="p-4 border-b border-surface-border flex items-center gap-3">
                            <Search size={18} className="text-surface-muted" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search commands, customers, or actions..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-surface-text placeholder:text-surface-muted"
                            />
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-muted-bg rounded border border-surface-border">
                                <span className="text-[9px] font-bold text-surface-muted uppercase tracking-wider">ESC</span>
                            </div>
                        </div>

                        <div className="max-h-[50vh] overflow-y-auto p-2 custom-scrollbar">
                            {allItems.length > 0 ? (
                                <div className="space-y-4">
                                    {/* Quick Actions Section */}
                                    {allItems.some(i => i.id.startsWith('new-')) && (
                                        <div className="space-y-1">
                                            <p className="px-3 py-2 text-[10px] font-bold text-surface-muted uppercase tracking-widest">Quick Actions</p>
                                            <div className="space-y-0.5">
                                                {allItems.filter(i => i.id.startsWith('new-')).map((item) => {
                                                    const globalIdx = allItems.indexOf(item);
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => handleAction(item)}
                                                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                                                            className={`w-full flex items-center justify-between p-2 rounded-md transition-all group ${selectedIndex === globalIdx ? 'bg-surface-muted-bg' : 'hover:bg-surface-hover'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-md flex items-center justify-center border border-surface-border ${selectedIndex === globalIdx ? 'bg-surface-card shadow-sm' : 'bg-surface-muted-bg'}`}>
                                                                    <item.icon size={14} className={item.color} />
                                                                </div>
                                                                <span className={`text-sm font-medium ${selectedIndex === globalIdx ? 'text-surface-text' : 'text-surface-muted'}`}>{item.label}</span>
                                                            </div>
                                                            <div className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase ${selectedIndex === globalIdx ? 'bg-primary-50 border-primary-100 text-primary-600' : 'bg-surface-muted-bg border-surface-border text-surface-muted'}`}>Action</div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Navigation Section */}
                                    {allItems.some(i => !i.id.startsWith('new-')) && (
                                        <div className="space-y-1">
                                            <p className="px-3 py-2 text-[10px] font-bold text-surface-muted uppercase tracking-widest">Navigation</p>
                                            <div className="space-y-0.5">
                                                {allItems.filter(i => !i.id.startsWith('new-')).map((item) => {
                                                    const globalIdx = allItems.indexOf(item);
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => handleAction(item)}
                                                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                                                            className={`w-full flex items-center justify-between p-2 rounded-md transition-all group ${selectedIndex === globalIdx ? 'bg-surface-muted-bg' : 'hover:bg-surface-hover'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-md flex items-center justify-center border border-surface-border ${selectedIndex === globalIdx ? 'bg-surface-card shadow-sm' : 'bg-surface-muted-bg'}`}>
                                                                    <item.icon size={14} className="text-surface-muted" />
                                                                </div>
                                                                <span className={`text-sm font-medium ${selectedIndex === globalIdx ? 'text-surface-text' : 'text-surface-muted'}`}>{item.label}</span>
                                                            </div>
                                                            <ArrowRight size={14} className={`text-surface-muted transition-transform ${selectedIndex === globalIdx ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`} />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="inline-flex items-center justify-center w-12 h-12 bg-surface-muted-bg text-surface-muted rounded-lg mb-4 border border-surface-border">
                                        <Zap size={24} />
                                    </div>
                                    <p className="text-surface-muted text-sm font-medium">No results found for "{query}"</p>
                                    <p className="text-[11px] text-surface-muted mt-1">Try searching for 'Panel', 'Contacts' or 'New Action'</p>
                                </div>
                            )}
                        </div>

                        <div className="px-4 py-3 bg-surface-muted-bg/30 border-t border-surface-border flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-surface-muted">
                                    <kbd className="px-1.5 py-0.5 bg-surface-card border border-surface-border rounded shadow-sm text-surface-muted">↑↓</kbd>
                                    Navigate
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-surface-muted">
                                    <kbd className="px-1.5 py-0.5 bg-surface-card border border-surface-border rounded shadow-sm text-surface-muted">Enter</kbd>
                                    Select
                                </div>
                            </div>
                            <div className="text-[9px] font-bold text-surface-muted uppercase tracking-widest">
                                PyCRM Command Center
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
