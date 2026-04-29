import { useState, lazy, Suspense } from 'react';
import {
    User,
    Bell,
    Shield,
    Palette,
    Save,
    RefreshCw,
    History,
    Settings as SettingsIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Badge } from '../UI/Badge';
import { Skeleton } from '../UI/Skeleton';

const AuditLogs = lazy(() => import('./AuditLogs'));

const SettingsView = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [isSaving, setIsSaving] = useState(false);

    const tabs = [
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'appearance', label: 'Appearance', icon: Palette },
    ];

    if (user?.role === 'admin') {
        tabs.push({ id: 'audit', label: 'Activity Log', icon: History });
    }

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            // In a real app, this would be an API call
        }, 800);
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
                <Button
                    onClick={handleSave}
                    isLoading={isSaving}
                    variant="primary"
                    size="md"
                >
                    {!isSaving && <Save size={16} className="mr-2" />}
                    Save Changes
                </Button>
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

                    {activeTab !== 'profile' && activeTab !== 'audit' && (
                        <div className="h-full flex flex-col items-center justify-center text-surface-muted py-12">
                            <RefreshCw size={48} className="mb-4 opacity-10" />
                            <p className="text-xs font-bold uppercase tracking-widest opacity-60">Module in Development</p>
                            <p className="text-[10px] mt-1">Full functionality will be available in the next release.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
