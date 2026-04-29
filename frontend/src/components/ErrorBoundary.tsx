import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorId: ''
    };

    public static getDerivedStateFromError(error: Error): State {
        const errorId = 'react-fault-' + Math.random().toString(36).substring(7).toUpperCase();
        return { hasError: true, error, errorId };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`[UI CRASH][${this.state.errorId}] Catastrophic render failure:`, error, errorInfo);
    }

    private handleReset = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-surface-bg flex items-center justify-center p-6">
                    <div className="max-w-xl w-full bg-surface-card rounded-[3rem] p-12 border border-surface-border shadow-2xl text-center space-y-8">
                        <div className="inline-flex h-24 w-24 items-center justify-center bg-rose-500/10 rounded-3xl text-rose-500 animate-pulse">
                            <AlertCircle size={48} />
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-4xl font-black text-surface-text tracking-tight">Ocurrió un Fallo Crítico</h1>
                            <p className="text-surface-muted font-bold leading-relaxed text-lg">
                                La consola de mando ha experimentado una excepción no controlada en el renderizado. Por seguridad, la interfaz se ha bloqueado.
                            </p>
                        </div>

                        <div className="bg-surface-muted-bg/40 p-6 rounded-2xl text-left border border-surface-border">
                            <p className="text-[10px] font-black text-surface-muted uppercase tracking-widest mb-2">Internal Fault Report</p>
                            <code className="text-xs font-mono text-rose-500 break-all">{this.state.error?.message}</code>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 flex items-center justify-center gap-3 bg-primary-600 text-white px-8 h-16 rounded-2xl font-black hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/30"
                            >
                                <RefreshCcw size={20} />
                                Reiniciar Interfaz
                            </button>
                            <a
                                href="/"
                                className="flex-1 flex items-center justify-center gap-3 bg-surface-card text-surface-text px-8 h-16 rounded-2xl font-black border border-surface-border hover:bg-surface-hover transition-all"
                            >
                                <Home size={20} />
                                Volver al Inicio
                            </a>
                        </div>

                        <p className="text-[10px] font-black text-surface-muted uppercase tracking-widest pt-4">
                            FaultID: {this.state.errorId} | PyCRM Enterprise Management
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
