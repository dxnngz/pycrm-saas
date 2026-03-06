import React from 'react';
import {
    Menu,
    Search,
    Command,
    AlignJustify,
    Sun,
    Moon,
    Bell
} from 'lucide-react';
import { Breadcrumbs } from '../Common/Breadcrumbs';
import { Avatar } from '../UI/Avatar';

interface HeaderProps {
    title: string;
    isDarkMode: boolean;
    setIsDarkMode: (dark: boolean) => void;
    isDenseMode: boolean;
    setIsDenseMode: (dense: boolean) => void;
    setIsMobileMenuOpen: (open: boolean) => void;
    setIsNotificationsOpen: (open: boolean) => void;
    setIsCommandCenterOpen: (open: boolean) => void;
    userName?: string;
}

export const Header: React.FC<HeaderProps> = ({
    title,
    isDarkMode,
    setIsDarkMode,
    isDenseMode,
    setIsDenseMode,
    setIsMobileMenuOpen,
    setIsNotificationsOpen,
    setIsCommandCenterOpen,
    userName
}) => {
    return (
        <header className="h-14 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                >
                    <Menu size={20} />
                </button>

                <div className="hidden sm:block">
                    <Breadcrumbs items={[{ label: title }]} />
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Command Bar Hook */}
                <div
                    onClick={() => setIsCommandCenterOpen(true)}
                    className="relative w-64 hidden md:flex items-center group cursor-pointer"
                >
                    <Search className="absolute left-3 text-slate-400 group-hover:text-slate-500 transition-colors" size={14} />
                    <div className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-medium">Quick Search...</span>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[9px] font-bold text-slate-400">
                                <Command size={9} /> K
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preference Switchers */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setIsDenseMode(!isDenseMode)}
                        className={`p-1.5 rounded-md transition-all ${isDenseMode ? 'bg-white dark:bg-slate-800 shadow-sm text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Toggle high density mode"
                    >
                        <AlignJustify size={14} />
                    </button>
                    <div className="w-px h-3 bg-slate-200 dark:bg-slate-800 mx-0.5" />
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Toggle dark mode"
                    >
                        {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                    </button>
                </div>

                {/* Notifications */}
                <button
                    onClick={() => setIsNotificationsOpen(true)}
                    className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg relative transition-colors"
                >
                    <Bell size={18} />
                    <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary-600 rounded-full border border-white dark:border-slate-950"></span>
                </button>

                {/* User Profile */}
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />
                <button className="flex items-center gap-2 group">
                    <Avatar
                        name={userName}
                        size="sm"
                        className="group-hover:ring-2 group-hover:ring-primary-500/50 transition-all"
                    />
                </button>
            </div>
        </header>
    );
};
