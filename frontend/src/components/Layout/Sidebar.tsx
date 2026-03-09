import React from 'react';
import {
    LogOut,
    Settings,
    BarChart3
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
    id: string;
    label: string;
    icon: LucideIcon;
}

interface SidebarProps {
    navItems: NavItem[];
    activeView: string;
    setActiveView: (view: any) => void;
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
    return (
        <aside className={`
            w-64 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 
            flex flex-col fixed h-full z-40 transition-transform duration-300 
            lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            <div className="flex flex-col h-full">
                {/* Brand */}
                <div className="p-6">
                    <div className="flex items-center gap-2.5 mb-10 pl-1">
                        <div className="w-7 h-7 bg-slate-900 dark:bg-white rounded flex items-center justify-center">
                            <BarChart3 size={16} className="text-white dark:text-slate-900" />
                        </div>
                        <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white uppercase tracking-[0.05em]">PyCRM</span>
                    </div>

                    <nav className="space-y-1" aria-label="Main Navigation">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-3">Navigation</p>
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                aria-current={activeView === item.id ? 'page' : undefined}
                                onClick={() => {
                                    setActiveView(item.id);
                                    setIsMobileMenuOpen(false);
                                }}
                                onMouseEnter={() => prefetchView(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all group ${activeView === item.id
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold ring-1 ring-slate-200 dark:ring-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                                    }`}
                            >
                                <item.icon size={16} className={`${activeView === item.id ? 'text-primary-600 dark:text-primary-400' : 'opacity-70 group-hover:opacity-100 group-hover:text-primary-600'} transition-colors`} aria-hidden="true" />
                                <span className="text-xs">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Footer Actions */}
                <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-800 space-y-1 bg-slate-50/50 dark:bg-slate-950/50">
                    <button
                        onClick={() => {
                            setActiveView('settings');
                            setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-xs font-medium ${activeView === 'settings'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                            }`}
                    >
                        <Settings size={16} />
                        <span>Configuration</span>
                    </button>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-xs font-medium"
                    >
                        <LogOut size={16} />
                        <span>Log out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};
