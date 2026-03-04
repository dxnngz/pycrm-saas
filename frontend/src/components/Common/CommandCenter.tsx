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
    { id: 'new-client', label: 'Nuevo Cliente', icon: Plus, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'new-opp', label: 'Nueva Oportunidad', icon: Target, color: 'text-primary-500', bg: 'bg-primary-500/10' },
    { id: 'new-task', label: 'Asignar Tarea', icon: CheckSquare, color: 'text-amber-500', bg: 'bg-amber-500/10' },
];

const NAVIGATION: CommandCenterItem[] = [
    { id: 'dashboard', label: 'Ir al Panel', icon: Command, color: 'text-slate-400', bg: 'bg-slate-100' },
    { id: 'contacts', label: 'Ver Clientes', icon: Users, color: 'text-slate-400', bg: 'bg-slate-100' },
    { id: 'pipeline', label: 'Ventas y Embudo', icon: Target, color: 'text-slate-400', bg: 'bg-slate-100' },
    { id: 'tasks', label: 'Gestor de Tareas', icon: CheckSquare, color: 'text-slate-400', bg: 'bg-slate-100' },
    { id: 'documents', label: 'Repositorio Documental', icon: FileText, color: 'text-slate-400', bg: 'bg-slate-100' },
    { id: 'settings', label: 'Configuración', icon: Settings, color: 'text-slate-400', bg: 'bg-slate-100' },
];

export const CommandCenter: React.FC<CommandCenterProps> = ({ isOpen, onClose, onNavigate }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const allItems = [...QUICK_ACTIONS, ...NAVIGATION].filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setQuery('');
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleAction = useCallback((item: CommandCenterItem) => {
        if (item.id.startsWith('new-')) {
            toast.info(`Funcionalidad '${item.label}' se abrirá en el modal correspondiente.`);
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
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary-600/10 text-primary-600 rounded-xl flex items-center justify-center">
                                <Search size={20} />
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Escribe para buscar comandos o clientes..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-lg font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ESC para salir</span>
                            </div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
                            {allItems.length > 0 ? (
                                <div className="space-y-6">
                                    {/* Quick Actions Section */}
                                    {allItems.some(i => i.id.startsWith('new-')) && (
                                        <div className="space-y-3">
                                            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones Rápidas</p>
                                            <div className="space-y-1">
                                                {allItems.filter(i => i.id.startsWith('new-')).map((item) => {
                                                    const globalIdx = allItems.indexOf(item);
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => handleAction(item)}
                                                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                                                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${selectedIndex === globalIdx ? 'bg-primary-600 text-white shadow-xl shadow-primary-600/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedIndex === globalIdx ? 'bg-white/20' : item.bg + ' ' + (item.color || '')}`}>
                                                                    <item.icon size={20} />
                                                                </div>
                                                                <span className="font-bold">{item.label}</span>
                                                            </div>
                                                            <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${selectedIndex === globalIdx ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>Acción</div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Navigation Section */}
                                    {allItems.some(i => !i.id.startsWith('new-')) && (
                                        <div className="space-y-3">
                                            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Navegación del Sistema</p>
                                            <div className="space-y-1">
                                                {allItems.filter(i => !i.id.startsWith('new-')).map((item) => {
                                                    const globalIdx = allItems.indexOf(item);
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => handleAction(item)}
                                                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                                                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${selectedIndex === globalIdx ? 'bg-primary-600 text-white shadow-xl shadow-primary-600/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedIndex === globalIdx ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                                    <item.icon size={20} />
                                                                </div>
                                                                <span className="font-bold">{item.label}</span>
                                                            </div>
                                                            <ArrowRight size={18} className={`transition-transform ${selectedIndex === globalIdx ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`} />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-3xl mb-4">
                                        <Zap size={32} />
                                    </div>
                                    <p className="text-slate-500 font-bold">No se encontraron resultados para "{query}"</p>
                                    <p className="text-xs text-slate-400 mt-2">Intenta buscar 'Panel', 'Ventas' o 'Nuevo Cliente'</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 font-bold text-[10px] text-slate-400">
                                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">↑↓</kbd>
                                    Navegar
                                </div>
                                <div className="flex items-center gap-1.5 font-bold text-[10px] text-slate-400">
                                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">Enter</kbd>
                                    Seleccionar
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">PyCRM COMMAND CENTER</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
