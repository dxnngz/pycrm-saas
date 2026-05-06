import { useState, lazy, Suspense } from 'react';
import {
    User,
    Bell,
    Shield,
    Palette,
    History,
    Settings as SettingsIcon,
    Database,
    Mail
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../hooks/useUI';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Badge } from '../UI/Badge';
import { Skeleton } from '../UI/Skeleton';
import { toast } from 'sonner';
import { demoService } from '../../services/demo.service';
import { authService } from '../../services/auth.service';

const AuditLogs = lazy(() => import('./AuditLogs'));

const SettingsView = () => {
    const { user, logout } = useAuth();
    const { isDense, toggleDense } = useUI();
    const [activeTab, setActiveTab] = useState('profile');
    const [demoLoading, setDemoLoading] = useState(false);
    const [testEmailLoading, setTestEmailLoading] = useState(false);
    const [testEmailTo, setTestEmailTo] = useState(user?.email || '');
    const [notifEmail, setNotifEmail] = useState(() => localStorage.getItem('pycrm-notif-email') !== 'false');
    const [notifProduct, setNotifProduct] = useState(() => localStorage.getItem('pycrm-notif-product') !== 'false');
    const [notifDigest, setNotifDigest] = useState(() => localStorage.getItem('pycrm-notif-digest') === 'true');
    const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'));
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    const tabs = [
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'appearance', label: 'Appearance', icon: Palette },
    ];

    if (user?.role === 'admin') {
        tabs.push({ id: 'audit', label: 'Activity Log', icon: History });
        tabs.push({ id: 'demo', label: 'Demo Data', icon: Database });
    }

    const persistNotif = (key: string, value: boolean) => {
        localStorage.setItem(key, String(value));
    };

    const applyTheme = (next: 'light' | 'dark') => {
        setTheme(next);
        localStorage.setItem('theme', next);
        window.location.reload();
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            toast.error('Completa todos los campos');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        setPasswordLoading(true);
        try {
            const res = await authService.changePassword(currentPassword, newPassword);
            toast.success(res.message || 'Contraseña actualizada');
            logout();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'No se pudo actualizar la contraseña';
            toast.error(msg);
        } finally {
            setPasswordLoading(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
    };

    const handleSeedDemo = async () => {
        setDemoLoading(true);
        try {
            const res = await demoService.seed();
            toast.success(res.message);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'No se pudo crear datos de demostración';
            toast.error(msg);
        } finally {
            setDemoLoading(false);
        }
    };

    const handleSendTestEmail = async () => {
        setTestEmailLoading(true);
        try {
            const res = await demoService.testEmail(testEmailTo);
            toast.success(res.message);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'No se pudo enviar el email de prueba';
            toast.error(msg);
        } finally {
            setTestEmailLoading(false);
        }
    };

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-surface-text">Settings</h1>
                    <p className="text-sm text-surface-muted mt-1 flex items-center gap-1.5">
                        <SettingsIcon size={14} className="text-surface-muted" />
                        Manage your account preferences and application settings.
                    </p>
                </div>
                <Badge variant="success">Guardado automático</Badge>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                <div className="w-full lg:w-64 space-y-1 shrink-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-surface-card text-primary-600 dark:text-primary-400 shadow-sm border border-surface-border'
                                : 'text-surface-muted hover:text-surface-text hover:bg-surface-hover'
                                }`}
                        >
                            <tab.icon size={18} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex-1 bg-surface-card rounded-lg border border-surface-border shadow-sm overflow-y-auto p-8">
                    {activeTab === 'profile' && (
                        <div className="max-w-2xl space-y-8">
                            <div className="flex items-center gap-6 pb-6 border-b border-surface-border">
                                <div className="w-20 h-20 bg-surface-muted-bg rounded-lg border border-surface-border flex items-center justify-center text-surface-muted text-2xl font-bold">
                                    {user?.name?.charAt(0) || 'A'}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-surface-text">{user?.name}</h3>
                                    <p className="text-xs text-surface-muted uppercase font-bold tracking-wider">{user?.role} Access</p>
                                    <button className="mt-2 text-[11px] font-bold text-primary-600 hover:text-primary-700 transition-colors uppercase tracking-tight">Change Avatar</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Full Name"
                                    type="text"
                                    defaultValue={user?.name}
                                    placeholder="Your full name"
                                />
                                <Input
                                    label="Email Address"
                                    type="email"
                                    defaultValue={user?.email}
                                    disabled
                                    placeholder="your@email.com"
                                />
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-surface-text pt-4">Workspace Info</h4>
                                <div className="p-4 rounded-lg bg-surface-muted-bg/40 border border-surface-border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-surface-text uppercase tracking-wider">Plan</p>
                                            <p className="text-xs text-surface-muted">Enterprise Professional</p>
                                        </div>
                                        <Badge variant="success">Active</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'audit' && (
                        <Suspense fallback={<div className="space-y-4 pt-4"><Skeleton className="h-40 w-full rounded-2xl" /><Skeleton className="h-40 w-full rounded-2xl" /></div>}>
                            <AuditLogs />
                        </Suspense>
                    )}

                    {activeTab === 'demo' && user?.role === 'admin' && (
                        <div className="max-w-2xl space-y-8">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-surface-text">Demo Data</h3>
                                <p className="text-sm text-surface-muted">
                                    Crea un dataset de ejemplo para que la app se vea completa en la presentación.
                                </p>
                            </div>

                            <div className="p-4 rounded-lg bg-surface-muted-bg/40 border border-surface-border space-y-3">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-surface-text uppercase tracking-wider">Seed</p>
                                        <p className="text-xs text-surface-muted">Clientes, pipeline, tareas, calendario, documentos y productos.</p>
                                    </div>
                                    <Button variant="primary" onClick={handleSeedDemo} isLoading={demoLoading}>
                                        <Database size={16} className="mr-2" />
                                        Crear datos
                                    </Button>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-surface-muted-bg/40 border border-surface-border space-y-3">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-surface-text uppercase tracking-wider">Email test</p>
                                    <p className="text-xs text-surface-muted">Verifica Mailjet/SMTP enviando un email de prueba.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Input
                                        label="To"
                                        type="email"
                                        value={testEmailTo}
                                        onChange={(e) => setTestEmailTo(e.target.value)}
                                        placeholder="tu@email.com"
                                    />
                                    <div className="flex items-end">
                                        <Button variant="outline" onClick={handleSendTestEmail} isLoading={testEmailLoading} fullWidth>
                                            <Mail size={16} className="mr-2" />
                                            Enviar prueba
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="max-w-2xl space-y-8">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-surface-text">Notifications</h3>
                                <p className="text-sm text-surface-muted">Controla qué avisos quieres recibir.</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 rounded-lg bg-surface-muted-bg/40 border border-surface-border">
                                    <div>
                                        <p className="text-xs font-bold text-surface-text uppercase tracking-wider">Email alerts</p>
                                        <p className="text-xs text-surface-muted">Avisos críticos por email.</p>
                                    </div>
                                    <Button
                                        variant={notifEmail ? 'primary' : 'outline'}
                                        onClick={() => {
                                            const next = !notifEmail;
                                            setNotifEmail(next);
                                            persistNotif('pycrm-notif-email', next);
                                        }}
                                    >
                                        {notifEmail ? 'On' : 'Off'}
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-lg bg-surface-muted-bg/40 border border-surface-border">
                                    <div>
                                        <p className="text-xs font-bold text-surface-text uppercase tracking-wider">Product updates</p>
                                        <p className="text-xs text-surface-muted">Novedades y mejoras.</p>
                                    </div>
                                    <Button
                                        variant={notifProduct ? 'primary' : 'outline'}
                                        onClick={() => {
                                            const next = !notifProduct;
                                            setNotifProduct(next);
                                            persistNotif('pycrm-notif-product', next);
                                        }}
                                    >
                                        {notifProduct ? 'On' : 'Off'}
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-lg bg-surface-muted-bg/40 border border-surface-border">
                                    <div>
                                        <p className="text-xs font-bold text-surface-text uppercase tracking-wider">Weekly digest</p>
                                        <p className="text-xs text-surface-muted">Resumen semanal del pipeline.</p>
                                    </div>
                                    <Button
                                        variant={notifDigest ? 'primary' : 'outline'}
                                        onClick={() => {
                                            const next = !notifDigest;
                                            setNotifDigest(next);
                                            persistNotif('pycrm-notif-digest', next);
                                        }}
                                    >
                                        {notifDigest ? 'On' : 'Off'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="max-w-2xl space-y-8">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-surface-text">Appearance</h3>
                                <p className="text-sm text-surface-muted">Ajusta tema y densidad de la interfaz.</p>
                            </div>

                            <div className="p-4 rounded-lg bg-surface-muted-bg/40 border border-surface-border space-y-3">
                                <p className="text-xs font-bold text-surface-text uppercase tracking-wider">Theme</p>
                                <div className="flex gap-3">
                                    <Button variant={theme === 'light' ? 'primary' : 'outline'} onClick={() => applyTheme('light')}>Light</Button>
                                    <Button variant={theme === 'dark' ? 'primary' : 'outline'} onClick={() => applyTheme('dark')}>Dark</Button>
                                </div>
                                <p className="text-[10px] text-surface-muted">El cambio de tema aplica recargando la app.</p>
                            </div>

                            <div className="p-4 rounded-lg bg-surface-muted-bg/40 border border-surface-border space-y-3">
                                <p className="text-xs font-bold text-surface-text uppercase tracking-wider">Density</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-surface-muted">Modo compacto</p>
                                    <Button variant={isDense ? 'primary' : 'outline'} onClick={toggleDense}>{isDense ? 'On' : 'Off'}</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="max-w-2xl space-y-8">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-surface-text">Security</h3>
                                <p className="text-sm text-surface-muted">Actualiza tu contraseña de acceso.</p>
                            </div>

                            <div className="p-4 rounded-lg bg-surface-muted-bg/40 border border-surface-border space-y-4">
                                <Input
                                    label="Current password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="New password"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min 8 caracteres"
                                    />
                                    <Input
                                        label="Confirm new password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repite la nueva contraseña"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button variant="primary" onClick={handleChangePassword} isLoading={passwordLoading}>
                                        Update password
                                    </Button>
                                </div>
                                <p className="text-[10px] text-surface-muted">Al cambiar la contraseña se cierra la sesión.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
