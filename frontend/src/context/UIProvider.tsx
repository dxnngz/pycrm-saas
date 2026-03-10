import React, { useState, useEffect } from 'react';
import { UIContext } from './UIContext';

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDense, setIsDense] = useState(() => {
        const saved = localStorage.getItem('pycrm-dense-mode');
        return saved === 'true';
    });

    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('pycrm-sidebar-collapsed');
        return saved === 'true';
    });

    const toggleDense = () => {
        setIsDense((prev) => {
            const newValue = !prev;
            localStorage.setItem('pycrm-dense-mode', String(newValue));
            return newValue;
        });
    };

    useEffect(() => {
        localStorage.setItem('pycrm-sidebar-collapsed', String(sidebarCollapsed));
    }, [sidebarCollapsed]);

    useEffect(() => {
        if (isDense) {
            document.documentElement.classList.add('dense-mode');
        } else {
            document.documentElement.classList.remove('dense-mode');
        }
    }, [isDense]);

    return (
        <UIContext.Provider value={{ isDense, toggleDense, sidebarCollapsed, setSidebarCollapsed }}>
            {children}
        </UIContext.Provider>
    );
};
