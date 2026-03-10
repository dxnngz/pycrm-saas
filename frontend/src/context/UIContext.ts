import { createContext } from 'react';

export interface UIContextType {
    isDense: boolean;
    toggleDense: () => void;
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
}

export const UIContext = createContext<UIContextType | undefined>(undefined);
