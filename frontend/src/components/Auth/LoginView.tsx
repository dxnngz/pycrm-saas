import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { LogIn, Mail, Lock, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '../Common/Input';
import { motion, AnimatePresence } from 'framer-motion';

type AuthMode = 'login' | 'forgot' | 'reset';

const LoginView = () => {
    const { login } = useAuth();
    const [mode, setAuthMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const resetToken = urlParams.get('token');
        if (resetToken) {
            setToken(resetToken);
            setAuthMode('reset');
        }
    }, []);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await api.auth.login({ email, password });
            login(data);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error de conexión';
            setError(msg);
            toast.error('Fallo en la autenticación', { description: msg });
        } finally {
            setLoading(false);
        }
    };

    const handleForgot = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.auth.forgotPassword(email);
            setSuccess(true);
            toast.success('Protocolo de recuperación iniciado');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.auth.resetPassword(token, newPassword);
            setSuccess(true);
            toast.success('Seguridad actualizada con éxito');
            setTimeout(() => {
                window.history.replaceState({}, '', window.location.pathname);
                setAuthMode('login');
                setSuccess(false);
            }, 3000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-500">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/50 p-10 border border-slate-100 dark:border-slate-800"
            >
                <AnimatePresence mode="wait">
                    {mode === 'login' && (
                        <motion.div
                            key="login"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <div className="text-center mb-10">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 text-white rounded-[2rem] mb-6 shadow-2xl shadow-primary-600/40">
                                    <LogIn size={40} />
                                </div>
                                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">PyCRM <span className="text-primary-600">SaaS</span></h2>
                                <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 text-sm uppercase tracking-widest">Portal de Inteligencia Enterprise</p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <Input
                                    label="Correo Corporativo"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    icon={<Mail size={20} />}
                                    required
                                    autoFocus
                                />

                                <div className="space-y-1">
                                    <div className="flex justify-between px-1">
                                        <span className="hidden">Espaciador</span>
                                        <button
                                            type="button"
                                            onClick={() => setAuthMode('forgot')}
                                            className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest hover:underline"
                                        >
                                            ¿Necesitas ayuda?
                                        </button>
                                    </div>
                                    <Input
                                        label="Contraseña"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        icon={<Lock size={20} />}
                                        required
                                    />
                                </div>

                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <p className="text-rose-500 text-[11px] font-black text-center uppercase tracking-widest bg-rose-500/10 py-3 rounded-xl border border-rose-500/20" aria-live="assertive">
                                                {error}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full h-16 bg-primary-600 text-white rounded-2xl font-black shadow-2xl shadow-primary-600/30 hover:bg-primary-700 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden group"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span className="uppercase tracking-widest text-xs">Iniciando sesión...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="uppercase tracking-widest text-xs">Acceder al Sistema</span>
                                            <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {mode === 'forgot' && (
                        <motion.div
                            key="forgot"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <div className="text-center mb-10">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 text-white rounded-[2rem] mb-6 shadow-2xl shadow-primary-600/40">
                                    <KeyRound size={40} />
                                </div>
                                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Recuperar Acceso</h2>
                                <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 text-sm uppercase tracking-widest">Protocolo de seguridad PyCRM</p>
                            </div>

                            {success ? (
                                <div className="text-center space-y-8">
                                    <div className="p-6 bg-emerald-500/10 text-emerald-600 rounded-[1.5rem] border border-emerald-500/20 font-bold text-sm">
                                        Si el correo está en nuestra base de datos, recibirá un enlace encriptado para restablecer su acceso.
                                    </div>
                                    <button
                                        onClick={() => { setAuthMode('login'); setSuccess(false); }}
                                        className="flex items-center justify-center gap-2 w-full h-16 text-slate-500 font-black hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-widest text-xs"
                                    >
                                        <ArrowLeft size={18} />
                                        Volver al Portal
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleForgot} className="space-y-6">
                                    <Input
                                        label="Correo Electrónico"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        icon={<Mail size={20} />}
                                        required
                                        helperText="Usaremos este correo para enviar el token de recuperación"
                                    />

                                    <button
                                        disabled={loading}
                                        type="submit"
                                        className="w-full h-16 bg-primary-600 text-white rounded-2xl font-black shadow-2xl shadow-primary-600/30 hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span className="uppercase tracking-widest text-xs">Procesando...</span>
                                            </>
                                        ) : (
                                            <span className="uppercase tracking-widest text-xs">Enviar Protocolo</span>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setAuthMode('login')}
                                        className="flex items-center justify-center gap-2 w-full py-4 text-slate-400 font-black hover:text-slate-600 transition-colors uppercase tracking-widest text-[10px]"
                                    >
                                        <ArrowLeft size={16} />
                                        Cancelar y volver
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    )}

                    {mode === 'reset' && (
                        <motion.div
                            key="reset"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <div className="text-center mb-10">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 text-white rounded-[2rem] mb-6 shadow-2xl shadow-primary-600/40">
                                    <Lock size={40} />
                                </div>
                                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Nueva Credencial</h2>
                                <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 text-sm uppercase tracking-widest">Establezca su nueva contraseña maestra</p>
                            </div>

                            {success ? (
                                <div className="text-center space-y-8">
                                    <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 text-emerald-600 rounded-full mb-2 border-2 border-emerald-500/20">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">¡Seguridad Restaurada!</p>
                                        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Redirigiendo de forma segura al portal...</p>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleReset} className="space-y-6">
                                    <Input
                                        label="Nueva Contraseña Maestra"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        icon={<Lock size={20} />}
                                        required
                                        minLength={6}
                                        helperText="Mínimo 6 caracteres alfanuméricos"
                                    />

                                    <button
                                        disabled={loading}
                                        type="submit"
                                        className="w-full h-16 bg-primary-600 text-white rounded-2xl font-black shadow-2xl shadow-primary-600/30 hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span className="uppercase tracking-widest text-xs">Actualizando...</span>
                                            </>
                                        ) : (
                                            <span className="uppercase tracking-widest text-xs">Solidificar Contraseña</span>
                                        )}
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default LoginView;
