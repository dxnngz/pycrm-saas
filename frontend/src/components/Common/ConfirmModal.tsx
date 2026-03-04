import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirmar',
    variant = 'danger',
    isLoading = false
}: ConfirmModalProps) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            type={variant === 'danger' ? 'danger' : 'default'}
            maxWidth="max-w-md"
        >
            <div className="space-y-8">
                <div className="flex gap-4">
                    <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${variant === 'danger' ? 'bg-rose-500/10 text-rose-500' :
                            variant === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                                'bg-primary-500/10 text-primary-500'
                        }`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-2-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 py-4 rounded-2-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl ${variant === 'danger' ? 'bg-rose-600 text-white shadow-rose-600/20 hover:bg-rose-700' :
                                variant === 'warning' ? 'bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600' :
                                    'bg-primary-600 text-white shadow-primary-600/20 hover:bg-primary-700'
                            }`}
                    >
                        {isLoading ? 'Procesando...' : confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
