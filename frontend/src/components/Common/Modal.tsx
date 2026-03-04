import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    type?: 'default' | 'confirm' | 'danger';
    maxWidth?: string;
}

const Modal = ({ isOpen, onClose, title, children, type = 'default', maxWidth = 'max-w-lg' }: ModalProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 40 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full ${maxWidth} bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] z-[70] overflow-hidden border border-slate-100 dark:border-slate-800`}
                    >
                        <div className={`px-8 py-6 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between ${type === 'danger' ? 'bg-rose-50/50 dark:bg-rose-500/5' : 'bg-slate-50/50 dark:bg-slate-900/50'
                            }`}>
                            <div>
                                <h3 className={`text-xl font-black tracking-tight ${type === 'danger' ? 'text-rose-600' : 'text-slate-900 dark:text-white'
                                    }`}>
                                    {title}
                                </h3>
                                {type === 'danger' && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-0.5">Acción Irreversible</p>}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Modal;
