import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
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
            const data = await api.auth.login({ email, password: pass });
            login(data);
        } catch (err: any) {
            const msg = err?.response?.data?.error || err.message || 'Authentication failed';
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
            const res = await api.auth.register({
                name: data.name,
                email: data.email,
                password: data.pass,
                companyName: data.company,
                role: 'admin'
            });
            login(res);
            toast.success('Account created successfully');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleForgot = async (email: string) => {
        setLoading(true);
        setError('');
        try {
            await api.auth.forgotPassword(email);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Request failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 p-6 font-inter">
            <div className="w-full max-w-[420px] space-y-8 animate-in fade-in zoom-in duration-300">
                {/* Minimal Header */}
                <div className="text-center space-y-1">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-slate-900 dark:bg-white rounded-lg mb-4">
                        <ShieldCheck className="text-white dark:text-slate-900" size={24} />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {mode === 'login' && 'Sign in to PyCRM'}
                        {mode === 'register' && 'Create your account'}
                        {mode === 'forgot' && 'Reset password'}
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {mode === 'login' && 'Enter your credentials to access your dashboard'}
                        {mode === 'register' && 'Provide your business details to get started'}
                        {mode === 'forgot' && 'Enter your email to receive a reset link'}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
                    <AnimatePresence mode="wait">
                        {mode === 'login' && (
                            <motion.div
                                key="login"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.15 }}
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
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.15 }}
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
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.15 }}
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
                        <p className="mt-4 text-[11px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-md border border-red-200 dark:border-red-500/20 text-center uppercase tracking-wider">
                            {error}
                        </p>
                    )}
                </div>

                {/* Footer Switcher */}
                <div className="text-center">
                    {mode === 'login' && (
                        <p className="text-xs text-slate-500 font-medium">
                            Don't have an account?{' '}
                            <button
                                onClick={() => setAuthMode('register')}
                                className="font-bold text-slate-900 dark:text-white hover:underline transition-all"
                            >
                                Create an account
                            </button>
                        </p>
                    )}
                    {mode !== 'login' && mode !== 'forgot' && (
                        <button
                            onClick={() => setAuthMode('login')}
                            className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all uppercase tracking-widest"
                        >
                            Back to login
                        </button>
                    )}
                </div>

                <div className="pt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-50">
                    &copy; 2026 PyCRM Enterprise &bull; Production Ready
                </div>
            </div>
        </div>
    );
};

export default LoginView;
