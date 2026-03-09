import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import type { User, AuthResponse, LoginCredentials, RegisterData } from '../types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const profile = await authService.getProfile();
                    setUser(profile);
                } catch (error) {
                    console.error('Auth check failed:', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        const response: AuthResponse = await authService.login(credentials);
        localStorage.setItem('token', response.token);
        if (response.refreshToken) localStorage.setItem('refreshToken', response.refreshToken);
        if (response.csrfToken) localStorage.setItem('csrfToken', response.csrfToken);
        setUser(response.user);
    };

    const register = async (data: RegisterData) => {
        const response: AuthResponse = await authService.register(data);
        localStorage.setItem('token', response.token);
        if (response.refreshToken) localStorage.setItem('refreshToken', response.refreshToken);
        if (response.csrfToken) localStorage.setItem('csrfToken', response.csrfToken);
        setUser(response.user);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('csrfToken');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
