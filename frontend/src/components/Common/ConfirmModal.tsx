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
                    <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${variant === 'danger' ? 'bg-danger-bg text-danger-icon' :
                            variant === 'warning' ? 'bg-warning-bg text-warning-icon' :
                                'bg-primary-500/10 text-primary-500'
                        }`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-surface-muted font-medium leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-surface-muted-bg text-surface-muted rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-surface-hover transition-all border border-surface-border"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl ${variant === 'danger' ? 'bg-danger-solid text-white hover:bg-danger-solid-hover' :
                                variant === 'warning' ? 'bg-warning-solid text-white hover:bg-warning-solid-hover' :
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
