import { customFetch, getHeaders, handleResponse } from './apiClient';
import type { LoginCredentials, RegisterData, AuthResponse, User } from '../types';

export const authService = {
    login: (credentials: LoginCredentials): Promise<AuthResponse> =>
        customFetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        }).then(handleResponse),

    register: (data: RegisterData): Promise<AuthResponse> =>
        customFetch('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(handleResponse),

    getProfile: (): Promise<User> =>
        customFetch('/auth/profile', { headers: getHeaders() }).then(handleResponse),

    forgotPassword: (email: string): Promise<{ message: string }> =>
        customFetch('/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        }).then(handleResponse),

    resetPassword: (token: string, newPassword: string): Promise<{ message: string }> =>
        customFetch('/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword }),
        }).then(handleResponse),
};
