import React from 'react';
import {
    LogOut,
    Settings,
    PanelLeftClose,
    PanelLeftOpen,
    Zap,
    ZapOff
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useUI } from '../../hooks/useUI';

interface NavItem {
    id: string;
    label: string;
    icon: LucideIcon;
}

interface SidebarProps {
    navItems: NavItem[];
    activeView: string;
    setActiveView: (view: string) => void;
    onLogout: () => void;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    prefetchView: (viewId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    navItems,
    activeView,
    setActiveView,
    onLogout,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    prefetchView
}) => {
    const { isDense, toggleDense, sidebarCollapsed, setSidebarCollapsed } = useUI();

    return (
        <aside className={`
            ${sidebarCollapsed ? 'w-16' : 'w-64'} bg-surface-bg border-r border-surface-border
            flex flex-col fixed h-full z-40 transition-all duration-300
            lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            <div className="flex flex-col h-full overflow-hidden">
                {/* Brand */}
                <div className="p-4 lg:p-6 flex-shrink-0">
                    <div className="flex items-center justify-between mb-8 group/header">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                <img src="/logo.png" alt="PyCRM Logo" className="w-full h-full object-contain" />
                            </div>
                            {!sidebarCollapsed && (
                                <span className="font-bold text-lg tracking-tight text-surface-text uppercase tracking-[0.05em] truncate">PyCRM</span>
                            )}
                        </div>
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="hidden lg:flex text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                        </button>
                    </div>

                    <nav className="space-y-1.5" aria-label="Main Navigation">
                        {!sidebarCollapsed && (
                            <p className="text-[10px] font-bold text-surface-muted uppercase tracking-widest mb-3 pl-3">Main</p>
                        )}
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                title={sidebarCollapsed ? item.label : undefined}
                                onClick={() => {
                                    setActiveView(item.id);
                                    setIsMobileMenuOpen(false);
                                }}
                                onMouseEnter={() => prefetchView(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${activeView === item.id
                                    ? 'bg-surface-card text-surface-text font-bold ring-1 ring-surface-border shadow-sm'
                                    : 'text-surface-muted hover:text-surface-text hover:bg-surface-hover'
                                    }`}
                            >
                                <item.icon size={18} className={`${activeView === item.id ? 'text-primary-600 dark:text-primary-400' : 'opacity-70 group-hover:opacity-100'} transition-colors flex-shrink-0`} aria-hidden="true" />
                                {!sidebarCollapsed && <span className="text-xs truncate">{item.label}</span>}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Footer Actions */}
                <div className="mt-auto p-4 border-t border-surface-border bg-surface-bg/50 flex-shrink-0">
                    <button
                        onClick={toggleDense}
                        title={isDense ? "Switch to Default UI" : "Switch to High Density UI"}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 mb-1"
                    >
                        {isDense ? <ZapOff size={18} /> : <Zap size={18} />}
                        {!sidebarCollapsed && <span className="text-xs font-medium">{isDense ? 'Standard View' : 'Dense View'}</span>}
                    </button>

                    <button
                        onClick={() => {
                            setActiveView('settings');
                            setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-xs font-medium ${activeView === 'settings'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                            }`}
                    >
                        <Settings size={18} className="flex-shrink-0" />
                        {!sidebarCollapsed && <span>Configuration</span>}
                    </button>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-xs font-medium"
                    >
                        <LogOut size={18} className="flex-shrink-0" />
                        {!sidebarCollapsed && <span>Log out</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
};
