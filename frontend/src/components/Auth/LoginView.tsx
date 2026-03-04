import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
    Mail,
    Lock,
    ArrowLeft,
    ShieldCheck,
    Eye,
    EyeOff,
    CheckCircle2,
    Zap,
    AlertCircle,
    Globe,
    BarChart3,
    ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '../Common/Input';
import { motion, AnimatePresence } from 'framer-motion';

type AuthMode = 'login' | 'forgot' | 'reset';

const FEATURES = [
    {
        title: "Inteligencia Predictiva",
        desc: "Anticípate a tus cierres con algoritmos de IA entrenados en tu industria.",
        icon: Zap,
        color: "text-amber-500",
        bg: "bg-amber-500/10"
    },
    {
        title: "Omnicanalidad Real",
        desc: "Gestiona WhatsApp, Email y CRM desde una única consola de mando.",
        icon: Globe,
        color: "text-primary-500",
        bg: "bg-primary-500/10"
    },
    {
        title: "Seguridad Bancaria",
        desc: "Aislamiento tenant-level con encriptación AES-256 en reposo.",
        icon: ShieldCheck,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10"
    }
];

const LoginView = () => {
    const { login } = useAuth();
    const [mode, setAuthMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
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
        <div className="min-h-screen flex bg-white dark:bg-slate-950 overflow-hidden font-inter">
            {/* Left Side: Dynamic Feature Showcase */}
            <div className="hidden lg:flex lg:w-3/5 xl:w-[65%] relative overflow-hidden bg-slate-900 group">
                <img
                    src="/assets/login-bg.png"
                    className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105 group-hover:scale-100 transition-transform duration-[10s] ease-out"
                    alt="Network focus"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>

                <div className="relative z-10 p-16 xl:p-24 flex flex-col justify-between h-full w-full">
                    <div className="flex items-center gap-4 text-white">
                        <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary-600/50">
                            <BarChart3 size={32} />
                        </div>
                        <div>
                            <span className="font-black text-3xl tracking-tighter block leading-none">PyCRM</span>
                            <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mt-1 block">Enterprise AI Systems</span>
                        </div>
                    </div>

                    <div className="max-w-2xl">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-6xl xl:text-7xl font-black text-white leading-none tracking-tight-extreme mb-8"
                        >
                            La Nueva Era del <br />
                            <span className="text-primary-400">Social Selling</span>.
                        </motion.h1>

                        <div className="grid grid-cols-1 gap-6 mt-16">
                            {FEATURES.map((f, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + (i * 0.1) }}
                                    className="flex items-start gap-5 p-6 rounded-3xl glass hover:bg-white/10 transition-colors group cursor-default"
                                >
                                    <div className={`w-12 h-12 ${f.bg} ${f.color} rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                        <f.icon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-white tracking-tight mb-1 text-lg">{f.title}</h3>
                                        <p className="text-slate-400 font-medium leading-relaxed text-sm">{f.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">
                        <p>© 2026 PYCRM ENTERPRISE CLOUD</p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-white transition-colors">Términos</a>
                            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                            <a href="#" className="hover:text-white transition-colors">Estado del Sistema</a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Auth Container */}
            <div className="w-full lg:w-2/5 xl:w-[35%] flex flex-col relative bg-white dark:bg-slate-950 px-8 py-12 lg:px-16 lg:py-24 overflow-y-auto">
                <div className="lg:hidden flex items-center gap-4 mb-12">
                    <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                        <BarChart3 size={24} className="text-white" />
                    </div>
                    <span className="font-black text-xl tracking-tighter text-slate-900 dark:text-white">PyCRM SaaS</span>
                </div>

                <div className="my-auto">
                    <AnimatePresence mode="wait">
                        {mode === 'login' && (
                            <motion.div
                                key="login"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-10"
                            >
                                <div className="space-y-3">
                                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Inicia Sesión</h2>
                                    <p className="text-slate-500 dark:text-slate-400 font-bold">Bienvenido de nuevo. Accede a tu consola de IA.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button className="flex items-center justify-center gap-3 h-14 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-bold text-sm text-slate-700 dark:text-slate-300">
                                        <img src="https://www.svgrepo.com/show/303108/google-icon-logo.svg" className="w-5 h-5" alt="Google" />
                                        Google
                                    </button>
                                    <button className="flex items-center justify-center gap-3 h-14 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-bold text-sm text-slate-700 dark:text-slate-300">
                                        <img src="https://www.svgrepo.com/show/303115/microsoft-5-logo.svg" className="w-5 h-5" alt="MS" />
                                        Outlook
                                    </button>
                                </div>

                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-900"></div></div>
                                    <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-400"><span className="bg-white dark:bg-slate-950 px-4">O usa tu correo corporativo</span></div>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-6">
                                    <Input
                                        label="Usuario / Correo Corporativo"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        icon={<Mail size={20} />}
                                        required
                                        autoFocus
                                    />

                                    <div className="space-y-1">
                                        <div className="flex justify-between px-1">
                                            <button
                                                type="button"
                                                onClick={() => setAuthMode('forgot')}
                                                className="text-[10px] ml-auto font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest hover:underline"
                                            >
                                                ¿Olvidaste tu contraseña?
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                label="Contraseña"
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                icon={<Lock size={20} />}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-[24px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 px-1 text-slate-500 dark:text-slate-400 transition-colors">
                                        <input
                                            id="rememberMe"
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="w-5 h-5 rounded-lg border-2 border-slate-200 dark:border-slate-800 text-primary-600 focus:ring-primary-500 transition-all cursor-pointer"
                                        />
                                        <label htmlFor="rememberMe" className="text-xs font-bold cursor-pointer select-none">Mantenerme conectado en este dispositivo</label>
                                    </div>

                                    <div className="min-h-[60px] flex items-center justify-center">
                                        <AnimatePresence mode="wait">
                                            {error ? (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="w-full flex items-center gap-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-4 rounded-2xl border border-rose-100 dark:border-rose-500/20 shadow-sm"
                                                    role="alert"
                                                    aria-live="assertive"
                                                >
                                                    <AlertCircle size={20} className="shrink-0" />
                                                    <p className="text-sm font-semibold">{error}</p>
                                                </motion.div>
                                            ) : (
                                                <motion.div key="empty-error" className="w-full h-full" />
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <button
                                        disabled={loading}
                                        type="submit"
                                        className="w-full h-16 bg-primary-600 text-white rounded-2xl font-black shadow-2xl shadow-primary-600/30 hover:bg-primary-700 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden group"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span className="uppercase tracking-widest text-xs">Validando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="uppercase tracking-widest text-xs font-black">Autenticar Acceso</span>
                                                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {mode === 'forgot' && (
                            <motion.div
                                key="forgot"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-10"
                            >
                                <div className="space-y-3 text-center lg:text-left">
                                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Recuperar Acceso</h2>
                                    <p className="text-slate-500 dark:text-slate-400 font-bold">Ingresa tu correo y te enviaremos una clave temporal.</p>
                                </div>

                                {success ? (
                                    <div className="text-center space-y-8">
                                        <div className="p-8 bg-emerald-500/10 text-emerald-600 rounded-[2rem] border border-emerald-500/20 font-bold text-sm leading-relaxed">
                                            Si el correo está en nuestra base de datos, recibirás un enlace encriptado para restablecer tu acceso.
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
                                            label="Correo Electrónico Corporativo"
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
                                                <span className="uppercase tracking-widest text-xs text-center">Procesando Protocolo...</span>
                                            ) : (
                                                <span className="uppercase tracking-widest text-xs font-black text-center">Enviar Protocolo de Seguridad</span>
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
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-10"
                            >
                                <div className="space-y-3">
                                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Nueva Credencial</h2>
                                    <p className="text-slate-500 dark:text-slate-400 font-bold">Establece tu nueva contraseña maestra de PyCRM.</p>
                                </div>

                                {success ? (
                                    <div className="text-center space-y-10 py-10">
                                        <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-500/10 text-emerald-600 rounded-[2.5rem] mb-2 border-2 border-emerald-500/20">
                                            <CheckCircle2 size={56} />
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">¡Éxito Total!</p>
                                            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-widest leading-relaxed">Redirigiendo de forma segura al portal energético...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleReset} className="space-y-8">
                                        <Input
                                            label="Nueva Contraseña Maestra"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            icon={<Lock size={20} />}
                                            required
                                            minLength={6}
                                            helperText="Mínimo 6 caracteres, incluye números y símbolos por seguridad"
                                        />

                                        <button
                                            disabled={loading}
                                            type="submit"
                                            className="w-full h-16 bg-primary-600 text-white rounded-2xl font-black shadow-2xl shadow-primary-600/30 hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                        >
                                            {loading ? (
                                                <span className="uppercase tracking-widest text-xs">Solidificando...</span>
                                            ) : (
                                                <span className="uppercase tracking-widest text-xs font-black">Confirmar Nueva Identidad</span>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-auto pt-16 lg:hidden">
                    <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        © 2026 PYCRM ENTERPRISE | CLOUD V3.0
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
