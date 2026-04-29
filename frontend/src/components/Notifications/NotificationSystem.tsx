import { useState } from 'react';
import { Bell, X, Info, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
    id: number;
    message: string;
    type: 'info' | 'warning' | 'success';
    time: string;
}

interface NotificationSystemProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationSystem = ({ isOpen, onClose }: NotificationSystemProps) => {
    const [notifications, setNotifications] = useState<Notification[]>([
        { id: 1, message: 'Nueva oportunidad ganada: Digital Flow SL (€5,000)', type: 'success', time: 'Hace 5 min' },
        { id: 2, message: 'Tarea pendiente: Revisión técnica con Tech Solutions', type: 'warning', time: 'Hace 1 hora' },
        { id: 3, message: 'Bienvenido al motor PyCRM Enterprise AI', type: 'info', time: 'Hoy, 09:00' },
    ]);

    const clearAll = () => setNotifications([]);
    const removeOne = (id: number) => setNotifications(prev => prev.filter(n => n.id !== id));

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-surface-text/60 backdrop-blur-sm z-40"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-surface-card shadow-2xl z-50 flex flex-col border-l border-surface-border"
                    >
                        <div className="p-8 border-b border-surface-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-600 rounded-xl text-white">
                                    <Bell size={20} />
                                </div>
                                <h2 className="text-xl font-black text-surface-text uppercase tracking-tighter">Centro de Actividad</h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-surface-hover rounded-xl transition-all">
                                <X size={24} className="text-surface-muted" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-4">
                            {notifications.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-surface-muted opacity-50">
                                    <CheckCircle size={64} className="mb-4" />
                                    <p className="font-black uppercase tracking-widest text-sm">Sin Notificaciones</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div key={n.id} className="group relative bg-surface-muted-bg/40 p-6 rounded-2xl border border-surface-border hover:border-primary-500/20 transition-all">
                                        <div className="flex gap-4">
                                            <div className={`mt-1 h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${n.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                                                n.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                                                    'bg-primary-500/10 text-primary-500'
                                                }`}>
                                                {n.type === 'success' ? <CheckCircle size={18} /> :
                                                    n.type === 'warning' ? <AlertTriangle size={18} /> :
                                                        <Info size={18} />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-surface-text leading-snug">{n.message}</p>
                                                <span className="text-[10px] font-black text-surface-muted uppercase tracking-widest mt-2 block">{n.time}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeOne(n.id)}
                                            className="absolute top-4 right-4 p-2 text-surface-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-8 border-t border-surface-border">
                                <button
                                    onClick={clearAll}
                                    className="w-full py-4 bg-surface-muted-bg text-surface-muted font-black text-xs uppercase tracking-widest rounded-xl hover:bg-surface-hover transition-all"
                                >
                                    Limpiar Todas
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NotificationSystem;
