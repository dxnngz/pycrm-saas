import React, { createContext, useContext, useState, useEffect } from 'react';

interface UIContextType {
    isDense: boolean;
    toggleDense: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDense, setIsDense] = useState(() => {
        const saved = localStorage.getItem('pycrm-dense-mode');
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
        if (isDense) {
            document.documentElement.classList.add('dense-mode');
        } else {
            document.documentElement.classList.remove('dense-mode');
        }
    }, [isDense]);

    return (
        <UIContext.Provider value={{ isDense, toggleDense }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
