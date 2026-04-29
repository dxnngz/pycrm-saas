import React from 'react';
import { useUI } from '../../hooks/useUI';

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
        <div className={`flex items-center gap-0.5 bg-surface-muted-bg/50 p-0.5 rounded-md border border-surface-border w-fit ${className}`}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`
                            flex items-center gap-2 ${isDense ? 'px-2.5 py-1 text-[10px]' : 'px-4 py-1.5 text-xs'} font-bold transition-all
                            ${isActive
                                ? 'bg-surface-card text-surface-text shadow-sm'
                                : 'text-surface-muted hover:text-surface-text'}
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
