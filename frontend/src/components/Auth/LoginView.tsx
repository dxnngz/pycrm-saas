import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotForm } from './ForgotForm';
import { ResetForm } from './ResetForm';
import { Alert } from '../UI/Alert';

type AuthMode = 'login' | 'forgot' | 'reset' | 'register';

const LoginView = () => {
    const { login } = useAuth();
    const [mode, setAuthMode] = useState<AuthMode>('login');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [resetToken, setResetToken] = useState('');

    const switchMode = (next: AuthMode) => {
        setAuthMode(next);
        setError('');
        setSuccess(false);
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const queryToken = urlParams.get('token');
        const pathMatch = window.location.pathname.match(/^\/reset-password\/([^/]+)$/);
        const pathToken = pathMatch?.[1];
        const token = queryToken || pathToken;
        if (token) {
            setResetToken(token);
            switchMode('reset');
        }
    }, []);

    const handleLogin = async (email: string, pass: string) => {
        setLoading(true);
        setError('');
        try {
            await login({ email, password: pass });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'No se pudo autenticar';
            setError(msg);
            toast.error('Acceso denegado', { description: msg });
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (data: { name: string; email: string; pass: string; company: string }) => {
        setLoading(true);
        setError('');
        try {
            await authService.register({
                name: data.name,
                email: data.email,
                password: data.pass,
                companyName: data.company,
            });
            await login({ email: data.email, password: data.pass });
            toast.success('Cuenta creada correctamente');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'No se pudo registrar';
            setError(msg);
            toast.error('No se pudo crear la cuenta', { description: msg });
        } finally {
            setLoading(false);
        }
    };

    const handleForgot = async (email: string) => {
        setLoading(true);
        setError('');
        try {
            await authService.forgotPassword(email);
            setSuccess(true);
            toast.success('Enlace enviado', { description: 'Si el email existe, recibirás un enlace en unos segundos.' });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'La solicitud falló';
            setError(msg);
            toast.error('No se pudo enviar', { description: msg });
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (newPassword: string) => {
        setLoading(true);
        setError('');
        try {
            if (!resetToken) throw new Error('Enlace de restablecimiento inválido');
            await authService.resetPassword(resetToken, newPassword);
            setSuccess(true);
            toast.success('Contraseña actualizada', { description: 'Ya puedes iniciar sesión con tu nueva contraseña.' });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'La solicitud falló';
            setError(msg);
            toast.error('No se pudo actualizar', { description: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-bg p-6 overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-500/10 blur-[120px] rounded-full" />

            <div className="w-full max-w-[440px] z-10 space-y-8">
                {/* Minimal Header */}
                <div className="text-center space-y-2">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center justify-center w-14 h-14 bg-surface-card rounded-2xl mb-4 shadow-2xl border border-surface-border"
                    >
                        <ShieldCheck className="text-primary-600" size={32} strokeWidth={1.5} />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-2xl font-bold tracking-tight text-surface-text"
                    >
                        {mode === 'login' && 'Portal de acceso'}
                        {mode === 'register' && 'Crear cuenta'}
                        {mode === 'forgot' && 'Recuperar acceso'}
                        {mode === 'reset' && 'Nueva contraseña'}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm font-medium text-surface-muted"
                    >
                        {mode === 'login' && 'Inicia sesión para acceder a tu espacio de trabajo'}
                        {mode === 'register' && 'Introduce los datos de tu organización para empezar'}
                        {mode === 'forgot' && 'Sigue los pasos para recuperar tu acceso'}
                        {mode === 'reset' && 'Define una nueva contraseña para recuperar el acceso'}
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-8 rounded-3xl overflow-hidden relative"
                >
                    <AnimatePresence mode="wait">
                        {mode === 'login' && (
                            <motion.div
                                key="login"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <LoginForm
                                    onSubmit={handleLogin}
                                    isLoading={loading}
                                    onForgotPassword={() => switchMode('forgot')}
                                />
                            </motion.div>
                        )}

                        {mode === 'register' && (
                            <motion.div
                                key="register"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <RegisterForm
                                    onSubmit={handleRegister}
                                    isLoading={loading}
                                    onBack={() => switchMode('login')}
                                />
                            </motion.div>
                        )}

                        {mode === 'forgot' && (
                            <motion.div
                                key="forgot"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ForgotForm
                                    onSubmit={handleForgot}
                                    isLoading={loading}
                                    onBack={() => switchMode('login')}
                                    success={success}
                                />
                            </motion.div>
                        )}

                        {mode === 'reset' && (
                            <motion.div
                                key="reset"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ResetForm
                                    onSubmit={handleReset}
                                    isLoading={loading}
                                    onBack={() => switchMode('login')}
                                    success={success}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-6"
                        >
                            <Alert variant="danger">{error}</Alert>
                        </motion.div>
                    )}
                </motion.div>

                {/* Footer Switcher */}
                <div className="text-center">
                    {mode === 'login' && (
                        <p className="text-sm text-surface-muted">
                            ¿Nueva organización?{' '}
                            <button
                                onClick={() => switchMode('register')}
                                className="text-primary-600 font-semibold hover:text-primary-700 transition-all"
                            >
                                Crear cuenta
                            </button>
                        </p>
                    )}
                    {mode !== 'login' && mode !== 'forgot' && (
                        <button
                            onClick={() => switchMode('login')}
                            className="text-sm font-semibold text-surface-muted hover:text-surface-text transition-all underline underline-offset-4"
                        >
                            Volver
                        </button>
                    )}
                </div>

                <div className="pt-8 text-center text-[10px] font-bold text-surface-muted uppercase tracking-[0.2em] opacity-50">
                    PyCRM Enterprise Node &bull; ENTORNO SEGURO
                </div>
            </div>
        </div>
    );
};

export default LoginView;
