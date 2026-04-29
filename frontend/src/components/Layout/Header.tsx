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
import { useUI } from '../../hooks/useUI';

interface HeaderProps {
    title: string;
    isDarkMode: boolean;
    setIsDarkMode: (dark: boolean) => void;
    setIsMobileMenuOpen: (open: boolean) => void;
    setIsNotificationsOpen: (open: boolean) => void;
    setIsCommandCenterOpen: (open: boolean) => void;
    userName?: string;
}

export const Header: React.FC<HeaderProps> = ({
    title,
    isDarkMode,
    setIsDarkMode,
    setIsMobileMenuOpen,
    setIsNotificationsOpen,
    setIsCommandCenterOpen,
    userName
}) => {
    const { isDense: isDenseMode, toggleDense: setIsDenseMode } = useUI();
    const [isOnline, setIsOnline] = React.useState(navigator.onLine);

    React.useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <header className="h-14 bg-surface-bg/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30 border-b border-surface-border transition-colors">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="lg:hidden p-2 text-surface-muted hover:text-surface-text"
                >
                    <Menu size={20} />
                </button>

                <div className="hidden sm:flex items-center gap-3">
                    <Breadcrumbs items={[{ label: title }]} />
                    {!isOnline && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-[10px] font-bold text-red-600 dark:text-red-400 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            OFFLINE MODE
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Command Bar Hook */}
                <div
                    onClick={() => setIsCommandCenterOpen(true)}
                    className="relative w-64 hidden md:flex items-center group cursor-pointer"
                >
                    <Search className="absolute left-3 text-surface-muted group-hover:text-surface-text transition-colors" size={14} />
                    <div className="w-full pl-9 pr-3 py-1.5 bg-surface-muted-bg/50 rounded-md border border-surface-border hover:bg-surface-hover transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-surface-muted font-medium">Quick Search...</span>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-surface-card border border-surface-border rounded text-[9px] font-bold text-surface-muted">
                                <Command size={9} /> K
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preference Switchers */}
                <div className="flex items-center gap-3">
                    <span className="hidden md:block text-[10px] font-bold text-surface-muted uppercase tracking-widest bg-surface-muted-bg px-2 py-0.5 rounded">v1.2.5-elite</span>
                    <div className="flex items-center gap-1 bg-surface-muted-bg/50 p-1 rounded-lg border border-surface-border">
                        <button
                            onClick={() => setIsDenseMode()}
                            className={`p-1.5 rounded-md transition-all ${isDenseMode ? 'bg-surface-card shadow-sm text-primary-600' : 'text-surface-muted hover:text-surface-text'}`}
                            title="Toggle high density mode"
                        >
                            <AlignJustify size={14} />
                        </button>
                        <div className="w-px h-3 bg-surface-border mx-0.5" />
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="p-1.5 text-surface-muted hover:text-surface-text transition-colors"
                            title="Toggle dark mode"
                        >
                            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                        </button>
                    </div>
                </div>

                {/* Notifications */}
                <button
                    onClick={() => setIsNotificationsOpen(true)}
                    className="p-2 text-surface-muted hover:bg-surface-hover rounded-lg relative transition-colors"
                >
                    <Bell size={18} />
                    <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary-600 rounded-full border border-surface-card"></span>
                </button>

                {/* User Profile */}
                <div className="h-8 w-px bg-surface-border mx-1 hidden sm:block" />
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
