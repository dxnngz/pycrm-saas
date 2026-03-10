import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Command, Users, Briefcase, CheckSquare,
    Zap, Plus, Target, FileText, Settings, ArrowRight, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_ACTIONS = [
    { id: 'new-client', label: 'Crear Nuevo Cliente', icon: Plus, path: '/clients', color: 'text-emerald-400' },
    { id: 'new-opp', label: 'Nueva Oportunidad', icon: Target, path: '/opportunities', color: 'text-indigo-400' },
    { id: 'new-task', label: 'Nueva Tarea', icon: CheckSquare, path: '/tasks', color: 'text-amber-400' },
];

const NAVIGATION = [
    { id: 'dashboard', label: 'Panel de Control', icon: Command, path: '/dashboard' },
    { id: 'contacts', label: 'Clientes y Contactos', icon: Users, path: '/contacts' },
    { id: 'pipeline', label: 'Pipeline de Ventas', icon: Briefcase, path: '/opportunities' },
    { id: 'tasks', label: 'Gestión de Tareas', icon: CheckSquare, path: '/tasks' },
    { id: 'documents', label: 'Bóveda de Documentos', icon: FileText, path: '/documents' },
    { id: 'settings', label: 'Configuración', icon: Settings, path: '/settings' },
];

import type { LucideIcon } from 'lucide-react';

interface SearchResult {
    id: string;
    label: string;
    icon: LucideIcon;
    path?: string;
    color?: string;
    type?: 'ai' | 'action' | 'nav';
}

export const CommandBar = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [results, setResults] = useState<SearchResult[]>([]);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Reset state on open in next tick to avoid synchronous setState inside effect warning
            const timerId = setTimeout(() => {
                setQuery('');
                setResults([]);
                setSelectedIndex(0);
                inputRef.current?.focus();
            }, 0);
            return () => clearTimeout(timerId);
        }
    }, [isOpen]);

    const handleSelect = useCallback((item: SearchResult) => {
        if (item.path) {
            navigate(item.path);
        }
        onClose();
    }, [navigate, onClose]);

    const handleSearch = (val: string) => {
        setQuery(val);
        if (val.length === 0) {
            setResults([]);
            return;
        }

        const filteredActions: SearchResult[] = QUICK_ACTIONS.filter(a => a.label.toLowerCase().includes(val.toLowerCase()));
        const filteredNav: SearchResult[] = NAVIGATION.filter(n => n.label.toLowerCase().includes(val.toLowerCase()));

        // Mock AI items
        const aiResults: SearchResult[] = val.length > 2 ? [
            { id: 'ai-1', label: `Analizar leads de "${val}"`, icon: Sparkles, type: 'ai', color: 'text-purple-400' },
            { id: 'ai-2', label: `Resumen de clientes en ${val}`, icon: Sparkles, type: 'ai', color: 'text-purple-400' }
        ] : [];

        setResults([...filteredActions, ...filteredNav, ...aiResults]);
        setSelectedIndex(0);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % (results.length || 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + (results.length || 1)) % (results.length || 1));
            } else if (e.key === 'Enter') {
                const selected = results[selectedIndex] || (query.length === 0 ? null : null);
                if (selected) handleSelect(selected);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex, query, onClose, handleSelect]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md pointer-events-auto"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="w-full max-w-2xl overflow-hidden glass-card rounded-2xl shadow-2xl pointer-events-auto border border-white/10 flex flex-col"
                    >
                        <div className="p-4 flex items-center gap-3 border-b border-white/10 shrink-0">
                            <Search className="w-5 h-5 text-slate-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Busca comandos, clientes o deja que la IA te ayude..."
                                className="w-full bg-transparent border-none outline-none text-slate-100 placeholder:text-slate-500 text-lg"
                                value={query}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded text-[10px] text-slate-400 font-mono">
                                ESC
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[60vh] p-2 custom-scrollbar">
                            {results.length > 0 ? (
                                <div className="space-y-1">
                                    {results.map((item, idx) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSelect(item)}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${selectedIndex === idx ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedIndex === idx ? 'bg-indigo-500/20' : 'bg-white/5'}`}>
                                                <item.icon className={`w-5 h-5 ${item.color || 'text-slate-400'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-slate-100 truncate">{item.label}</div>
                                                <div className="text-[10px] text-slate-500 uppercase tracking-widest">
                                                    {item.type === 'ai' ? 'Asistente IA' : item.id.includes('new') ? 'Acción Rápida' : 'Navegación'}
                                                </div>
                                            </div>
                                            {selectedIndex === idx && (
                                                <motion.div layoutId="arrow">
                                                    <ArrowRight className="w-4 h-4 text-indigo-400" />
                                                </motion.div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : query.length === 0 ? (
                                <div className="p-4 space-y-6">
                                    <div className="space-y-3">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Acciones Populares</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {QUICK_ACTIONS.map(action => (
                                                <button key={action.id} onClick={() => handleSelect(action)} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                                    <action.icon className={`w-4 h-4 ${action.color}`} />
                                                    <span className="text-xs text-slate-300">{action.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Navegación Recomendada</div>
                                        <div className="flex flex-wrap gap-2">
                                            {NAVIGATION.slice(0, 4).map(nav => (
                                                <button key={nav.id} onClick={() => handleSelect(nav)} className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[11px] text-slate-400 transition-colors border border-white/5">
                                                    {nav.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-10 text-center space-y-2">
                                    <div className="text-slate-300 font-medium">No se encontraron resultados</div>
                                    <div className="text-slate-500 text-xs">Intenta con "leads", "facturas" o el nombre de un cliente</div>
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-slate-900/50 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
                            <div className="flex gap-4">
                                <span><span className="bg-white/10 px-1 rounded text-slate-400 mr-1">↑↓</span> Navegar</span>
                                <span><span className="bg-white/10 px-1 rounded text-slate-400 mr-1">Enter</span> Seleccionar</span>
                            </div>
                            <div className="flex items-center gap-1 text-indigo-400/80">
                                <Zap className="w-3 h-3 fill-current" />
                                <span className="font-bold uppercase tracking-widest">PyCRM Nexus AI</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
