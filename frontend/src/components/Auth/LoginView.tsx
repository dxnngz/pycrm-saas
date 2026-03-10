import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotForm } from './ForgotForm';

type AuthMode = 'login' | 'forgot' | 'reset' | 'register';

const LoginView = () => {
    const { login } = useAuth();
    const [mode, setAuthMode] = useState<AuthMode>('login');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('token')) setAuthMode('reset');
    }, []);

    const handleLogin = async (email: string, pass: string) => {
        setLoading(true);
        setError('');
        try {
            await login({ email, password: pass });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Authentication failed';
            setError(msg);
            toast.error('Access denied', { description: msg });
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
            toast.success('Account created successfully');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Registration failed');
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
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Request failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />

            <div className="w-full max-w-[440px] z-10 space-y-8">
                {/* Minimal Header */}
                <div className="text-center space-y-2">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center justify-center w-14 h-14 bg-slate-950 dark:bg-white rounded-2xl mb-4 shadow-2xl border border-slate-800 dark:border-slate-200"
                    >
                        <ShieldCheck className="text-white dark:text-slate-950" size={32} strokeWidth={1.5} />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
                    >
                        {mode === 'login' && 'Identity Portal'}
                        {mode === 'register' && 'Account Activation'}
                        {mode === 'forgot' && 'Access Recovery'}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm font-medium text-slate-500 dark:text-slate-400"
                    >
                        {mode === 'login' && 'Sign in to access your enterprise workspace'}
                        {mode === 'register' && 'Enter your organization details to begin'}
                        {mode === 'forgot' && 'Follow the steps to recover your access'}
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
                                    onForgotPassword={() => setAuthMode('forgot')}
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
                                    onBack={() => setAuthMode('login')}
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
                                    onBack={() => { setAuthMode('login'); setSuccess(false); }}
                                    success={success}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {error && (
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-6 text-xs font-bold text-red-500 bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-center"
                        >
                            {error}
                        </motion.p>
                    )}
                </motion.div>

                {/* Footer Switcher */}
                <div className="text-center">
                    {mode === 'login' && (
                        <p className="text-sm text-slate-500">
                            New organization?{' '}
                            <button
                                onClick={() => setAuthMode('register')}
                                className="text-primary-600 font-semibold hover:text-primary-700 transition-all"
                            >
                                Register Instance
                            </button>
                        </p>
                    )}
                    {mode !== 'login' && mode !== 'forgot' && (
                        <button
                            onClick={() => setAuthMode('login')}
                            className="text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all underline underline-offset-4"
                        >
                            Return to Portal
                        </button>
                    )}
                </div>

                <div className="pt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-50">
                    PyCRM Enterprise Node &bull; SECURE ENVIRONMENT
                </div>
            </div>
        </div>
    );
};

export default LoginView;
