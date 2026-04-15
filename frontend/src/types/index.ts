export interface User {
    id: number;
    tenant_id: number;
    name: string;
    email: string;
    role: string;
    mfa_enabled: boolean;
    created_at?: string;
}

export interface Client {
    id: number;
    tenant_id: number;
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    status: 'activo' | 'inactivo';
    created_at?: string;
    email_opened?: boolean;
}

export interface Contact {
    id: number;
    tenant_id: number;
    client_id?: number;
    type: string;
    description?: string;
    contact_date: string;
}

export interface Document {
    id: number;
    tenant_id: number;
    client_id?: number;
    opportunity_id?: number;
    name: string;
    type: string;
    status?: string;
    amount?: number | string;
    created_at?: string;
    client_name?: string; // UI specific
}

export interface Event {
    id: number;
    tenant_id: number;
    user_id?: number;
    client_id?: number;
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
    color?: string;
}

export interface Product {
    id: number;
    tenant_id: number;
    name: string;
    description?: string;
    price: number | string;
    category?: string;
}

export interface Task {
    id: number;
    tenant_id: number;
    user_id?: number;
    client_id?: number;
    title: string;
    deadline?: string;
    priority?: 'Alta' | 'Media' | 'Baja';
    completed: boolean;
    client_name?: string; // UI specific
}

export interface Opportunity {
    id: number;
    tenant_id: number;
    client_id?: number;
    assigned_to?: number;
    product: string;
    amount: number | string;
    status: 'pendiente' | 'ganada' | 'perdida' | 'negociacion' | 'ganado' | 'perdido';
    estimated_close_date?: string;
    created_at?: string;
    client_name?: string; // UI specific
    client_company?: string; // UI specific
}

export interface AuthResponse {
    success: boolean;
    token: string;
    refreshToken: string;
    csrfToken: string;
    user: User;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    companyName: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    limit: number;
    cursor?: number;
    page?: number;
    totalPages?: number;
}
