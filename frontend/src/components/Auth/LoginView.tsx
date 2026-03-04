import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { LogIn, Mail, Lock, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

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
            setError(err instanceof Error ? err.message : 'Error de conexión');
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
            toast.success('Correo enviado');
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
            toast.success('Contraseña restablecida');
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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
                {mode === 'login' && (
                    <>
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-2xl mb-4 shadow-lg shadow-primary-600/20">
                                <LogIn size={32} />
                            </div>
                            <h2 className="text-3xl font-extrabold text-slate-900">Bienvenido de nuevo</h2>
                            <p className="text-slate-500 mt-2">Ingresa a tu cuenta de PyCRM</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                        placeholder="tu@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-semibold text-slate-700">Contraseña</label>
                                    <button 
                                        type="button"
                                        onClick={() => setAuthMode('forgot')}
                                        className="text-xs font-bold text-primary-600 hover:text-primary-700"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {error && <p className="text-rose-500 text-sm font-medium text-center">{error}</p>}

                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50"
                            >
                                {loading ? 'Cargando...' : 'Iniciar Sesión'}
                            </button>
                        </form>
                    </>
                )}

                {mode === 'forgot' && (
                    <>
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-2xl mb-4 shadow-lg shadow-primary-600/20">
                                <KeyRound size={32} />
                            </div>
                            <h2 className="text-3xl font-extrabold text-slate-900">Recuperar Acceso</h2>
                            <p className="text-slate-500 mt-2">Enviaremos un enlace a tu correo</p>
                        </div>

                        {success ? (
                            <div className="text-center space-y-6">
                                <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 font-medium">
                                    Si el correo está registrado, recibirás un enlace pronto.
                                </div>
                                <button
                                    onClick={() => { setAuthMode('login'); setSuccess(false); }}
                                    className="flex items-center justify-center gap-2 w-full py-4 text-slate-600 font-bold hover:text-slate-900 transition-colors"
                                >
                                    <ArrowLeft size={18} />
                                    Volver al inicio
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleForgot} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                            placeholder="tu@email.com"
                                            required
                                        />
                                    </div>
                                </div>

                                {error && <p className="text-rose-500 text-sm font-medium text-center">{error}</p>}

                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Enviando...' : 'Enviar Enlace'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setAuthMode('login')}
                                    className="flex items-center justify-center gap-2 w-full py-2 text-slate-500 font-bold hover:text-slate-700 transition-colors text-sm"
                                >
                                    <ArrowLeft size={16} />
                                    Cancelar y volver
                                </button>
                            </form>
                        )}
                    </>
                )}

                {mode === 'reset' && (
                    <>
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-2xl mb-4 shadow-lg shadow-primary-600/20">
                                <Lock size={32} />
                            </div>
                            <h2 className="text-3xl font-extrabold text-slate-900">Nueva Contraseña</h2>
                            <p className="text-slate-500 mt-2">Establece tus nuevas credenciales</p>
                        </div>

                        {success ? (
                            <div className="text-center space-y-6">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full mb-2">
                                    <CheckCircle2 size={24} />
                                </div>
                                <p className="text-slate-900 font-bold">¡Contraseña actualizada!</p>
                                <p className="text-slate-500 text-sm">Redirigiendo al inicio de sesión...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleReset} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nueva Contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                            placeholder="Mínimo 6 caracteres"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                {error && <p className="text-rose-500 text-sm font-medium text-center">{error}</p>}

                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Actualizando...' : 'Restablecer Contraseña'}
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default LoginView;
