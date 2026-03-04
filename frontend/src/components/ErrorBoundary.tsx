import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

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
        const errorId = 'react-err-' + Math.random().toString(36).substring(7);
        return { hasError: true, error, errorId };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`[Error Trace: ${this.state.errorId}] Uncaught React error:`, error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl premium-shadow max-w-lg w-full text-center">
                        <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl w-20 h-20 mx-auto flex items-center justify-center mb-6">
                            <AlertTriangle size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">¡Ups! Algo salió mal</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8">
                            Ha ocurrido un error inesperado. Por favor, recarga la página o contacta con soporte si el problema persiste.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-8 rounded-xl transition duration-300 transform hover:-translate-y-1 shadow-lg shadow-primary-500/30 w-full mb-4"
                        >
                            Recargar Página
                        </button>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Error Ref: {this.state.errorId}
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
