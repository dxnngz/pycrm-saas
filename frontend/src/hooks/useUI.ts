import { useContext } from 'react';
import { UIContext } from '../context/UIContext';
import type { UIContextType } from '../context/UIContext';

export const useUI = (): UIContextType => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
