import { type ReactNode, useEffect, useId, useRef } from 'react';
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
    const titleId = useId();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!isOpen) return;

        previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const timerId = window.setTimeout(() => {
            const container = containerRef.current;
            if (!container) return;
            const focusables = container.querySelectorAll<HTMLElement>(
                'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
            );
            (focusables[0] || container).focus();
        }, 0);

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onCloseRef.current();
                return;
            }
            if (e.key !== 'Tab') return;

            const container = containerRef.current;
            if (!container) return;
            const focusables = Array.from(
                container.querySelectorAll<HTMLElement>(
                    'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
                )
            ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1);

            if (focusables.length === 0) {
                e.preventDefault();
                return;
            }

            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = document.activeElement as HTMLElement | null;

            if (e.shiftKey) {
                if (!active || active === first || !container.contains(active)) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (active === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.clearTimeout(timerId);
            window.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = prevOverflow;
            previouslyFocusedRef.current?.focus?.();
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-surface-text/60 backdrop-blur-md z-[60]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 40 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        ref={containerRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        tabIndex={-1}
                        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full ${maxWidth} bg-surface-card rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] z-[70] overflow-hidden border border-surface-border`}
                    >
                        <div className={`px-8 py-6 border-b border-surface-border flex items-center justify-between ${type === 'danger' ? 'bg-danger-bg' : 'bg-surface-muted-bg/50'
                            }`}>
                            <div>
                                <h3 id={titleId} className={`text-xl font-black tracking-tight ${type === 'danger' ? 'text-danger-text' : 'text-surface-text'
                                    }`}>
                                    {title}
                                </h3>
                                {type === 'danger' && <p className="text-[10px] font-bold text-danger-text uppercase tracking-widest mt-0.5">Acción Irreversible</p>}
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Cerrar"
                                className="p-3 hover:bg-surface-hover rounded-2xl transition-all text-surface-muted hover:text-surface-text"
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
