export interface User {
    id: number;
    tenant_id: number;
    name: string;
    email: string;
    role: string;
    created_at?: string;
}

export interface Client {
    id: number;
    name: string;
    company: string;
    email: string;
    phone?: string;
    status?: string;
    created_at?: string;
}

export interface Opportunity {
    id: number;
    client_id: number;
    client_name?: string;
    client_company?: string;
    product: string;
    amount: number;
    status: 'pendiente' | 'ganado' | 'perdido';
    estimated_close_date?: string;
    created_at?: string;
}

export interface Task {
    id: number;
    user_id: number;
    client_id?: number;
    client_name?: string;
    title: string;
    deadline?: string;
    priority: 'Alta' | 'Media' | 'Baja';
    completed: boolean;
    created_at?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
    refreshToken?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface Contact {
    id: number;
    client_id: number;
    type: 'call' | 'email' | 'meeting' | 'note';
    description: string;
    contact_date: string;
}

export interface LoginCredentials {
    email: string;
    password?: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password?: string;
    role?: string;
}

export interface RecentActivityItem {
    id: string;
    type: 'sale' | 'task-done' | 'task-new';
    title: string;
    description: string;
    time: string;
    amount?: number;
}

export interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
    category?: string;
    created_at?: string;
}

export interface Event {
    id: number;
    user_id: number;
    client_id?: number;
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
    color?: string;
    created_at?: string;
}

export interface Document {
    id: number;
    client_id: number;
    client_name?: string;
    opportunity_id?: number;
    name: string;
    type: string;
    status: string;
    amount?: number;
    created_at?: string;
}
