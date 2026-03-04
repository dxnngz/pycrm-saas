import { useState } from 'react';
import {
    User,
    Bell,
    Shield,
    Palette,
    Zap,
    Save,
    RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SettingsView = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('perfil');
    const [isSaving, setIsSaving] = useState(false);

    const tabs = [
        { id: 'perfil', label: 'Mi Perfil', icon: User },
        { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
        { id: 'seguridad', label: 'Seguridad', icon: Shield },
        { id: 'apariencia', label: 'Apariencia', icon: Palette },
    ];

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            alert('Ajustes guardados con éxito (Simulación TFG)');
        }, 1000);
    };

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Configuración</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 flex items-center gap-2">
                        <Zap size={18} className="text-amber-500" />
                        Personaliza tu instancia de PyCRM Enterprise
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-3 bg-primary-600 text-white px-8 h-14 rounded-2xl font-black hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/30 active:scale-[0.98] disabled:opacity-50"
                >
                    {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                    <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
                <div className="w-full lg:w-72 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === tab.id
                                ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm border border-slate-100 dark:border-slate-800'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                        >
                            <tab.icon size={20} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex-1 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow p-10">
                    {activeTab === 'perfil' && (
                        <div className="space-y-8">
                            <div className="flex items-center gap-8 pb-8 border-b border-slate-50 dark:border-slate-800/50">
                                <div className="w-24 h-24 bg-gradient-to-tr from-primary-600 to-indigo-600 rounded-[2rem] shadow-2xl border-4 border-white dark:border-slate-800 flex items-center justify-center text-white text-3xl font-black">
                                    {user?.name?.charAt(0) || 'A'}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{user?.name}</h3>
                                    <p className="text-primary-600 dark:text-primary-400 font-black text-sm uppercase tracking-widest">{user?.role} Access</p>
                                    <button className="mt-4 text-xs font-black text-slate-400 hover:text-primary-500 transition-colors uppercase tracking-widest">Cambiar Avatar</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2">Nombre Completo</label>
                                    <input
                                        type="text"
                                        defaultValue={user?.name}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold dark:text-white"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        defaultValue={user?.email}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold dark:text-white opacity-50"
                                        disabled
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab !== 'perfil' && (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-300 dark:text-slate-800">
                            <RefreshCw size={64} className="mb-6 opacity-20" />
                            <p className="font-black uppercase tracking-widest text-sm">Módulo en Desarrollo</p>
                            <p className="text-xs font-bold mt-2">Funcionalidad completa disponible en la versión final</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
