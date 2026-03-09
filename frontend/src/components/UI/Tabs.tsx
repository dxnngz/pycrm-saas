import React from 'react';
import { useUI } from '../../context/UIContext';

interface TabItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface TabsProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (id: string) => void;
    className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
    const { isDense } = useUI();
    return (
        <div className={`flex items-center gap-0.5 bg-slate-50 dark:bg-slate-950 p-0.5 rounded-md border border-slate-200 dark:border-slate-800 w-fit ${className}`}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`
                            flex items-center gap-2 ${isDense ? 'px-2.5 py-1 text-[10px]' : 'px-4 py-1.5 text-xs'} font-bold transition-all
                            ${isActive
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}
                        `}
                    >
                        {tab.icon && <span className="opacity-70">{tab.icon}</span>}
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
};
