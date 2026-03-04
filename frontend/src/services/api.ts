import type { User, Client, Opportunity, Task, AuthResponse, LoginCredentials, RegisterData, PaginatedResponse, Contact, Product, Event, Document } from '../types';
import { toast } from 'sonner';
import { captureRUMMetrics, getMemoryUsage } from '../utils/metrics';
import { sanitizePayload } from '../utils/security';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const dashboardCache = new Map<string, { data: unknown, timestamp: number }>();

// --- Advanced API Integration Settings ---
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
    refreshSubscribers.forEach(cb => cb(token));
    refreshSubscribers = [];
};

// Listen for simulated Backend Purge events (Phase 3)
if (typeof window !== 'undefined') {
    const handleCacheInvalidate = (event: globalThis.Event) => {
        const customEvent = event as unknown as CustomEvent<{ key?: string }>;
        const key = customEvent.detail?.key;
        if (key && dashboardCache.has(key)) {
            dashboardCache.delete(key);
            console.info(`[API Cache] Purged key: ${key} due to backend invalidation.`);
        } else if (!key) {
            dashboardCache.clear();
            console.info(`[API Cache] Purged ALL due to backend invalidation.`);
        }
    };
    window.addEventListener('cache_invalidate', handleCacheInvalidate as EventListener);
}
// ------------------------------------------

const getCsrfToken = () => {
    const csrfMatch = document.cookie.match(/csrfToken=([^;]+)/);
    return csrfMatch ? csrfMatch[1] : '';
};

const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    // Inject CSRF protection dynamically
    const csrfToken = getCsrfToken();
    if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
    }

    return headers;
};

const customFetch = async (url: string, options?: RequestInit, retries = 1): Promise<Response> => {
    const start = performance.now();
    const requestId = 'req-' + Math.random().toString(36).substring(7);

    // Merge Request ID into headers for tracing backend to frontend
    const headers = new Headers(options?.headers);
    headers.set('X-Request-Id', requestId);

    // Auto-Sanitize outgoing JSON bodies for POST/PUT to prevent XSS
    let body = options?.body;
    if (body && typeof body === 'string' && (options?.method === 'POST' || options?.method === 'PUT' || options?.method === 'PATCH')) {
        try {
            const parsedBody = JSON.parse(body);
            const sanitizedBody = sanitizePayload(parsedBody);
            body = JSON.stringify(sanitizedBody);
        } catch { /* ignore non-json strings */ }
    }

    const finalOptions = { ...options, headers, body };

    try {
        const response = await fetch(url, finalOptions);
        const duration = performance.now() - start;

        // Capture RUM Metrics
        captureRUMMetrics({
            latencyMs: duration,
            endpoint: url.replace(API_URL, ''),
            method: finalOptions?.method || 'GET',
            status: response.status,
            requestID: requestId,
            timestamp: new Date().toISOString(),
            jsHeapSizeMB: getMemoryUsage()
        });

        // Attach request ID dynamically so handleResponse can use it
        (response as any).__requestId = requestId;

        if (!response.ok) {
            // CTO Level: Token expiring mid-mutation (Handling 401 transparently)
            if (response.status === 401) {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken && !window.location.pathname.includes('/login')) {
                    if (isRefreshing) {
                        return new Promise(resolve => {
                            subscribeTokenRefresh(() => resolve(customFetch(url, options, retries)));
                        });
                    }

                    isRefreshing = true;
                    try {
                        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ refreshToken }),
                        });

                        if (refreshRes.ok) {
                            const data = await refreshRes.json();
                            localStorage.setItem('token', data.token);
                            isRefreshing = false;
                            onRefreshed(data.token);
                            return customFetch(url, options, retries);
                        }
                    } catch (e) {
                        console.error('[Auth] Fallback token refresh error:', e);
                    } finally {
                        isRefreshing = false;
                    }
                }
            }

            if (response.status >= 500 && retries > 0) {
                console.warn(`[Retry] 5xx Error en ${url}. Intentos restantes: ${retries}`);
                return new Promise(resolve => setTimeout(resolve, 1000)).then(() => customFetch(url, options, retries - 1));
            }
        }

        return response;
    } catch (error) {
        if (retries > 0 && !(error instanceof Response && error.status < 500)) {
            console.warn(`[Retry] Network fallback en ${url}. Intentos restantes: ${retries}`);
            return new Promise(resolve => setTimeout(resolve, 1500)).then(() => customFetch(url, options, retries - 1));
        }

        const duration = performance.now() - start;
        captureRUMMetrics({
            latencyMs: duration,
            endpoint: url.replace(API_URL, ''),
            method: finalOptions?.method || 'GET',
            status: 0,
            requestID: requestId,
            timestamp: new Date().toISOString()
        });
        throw error;
    }
};

const handleResponse = async (response: Response) => {
    const contentType = response.headers.get('content-type');
    const requestId = (response as any).__requestId || 'local-fallback-' + Math.random().toString(36).substring(7);

    if (!response.ok) {
        // Log técnico de error para arquitectura senior con trazabilidad (request_id)
        console.error(`[API Error Trace: ${requestId}] ${response.status} ${response.statusText} en ${response.url}`);

        if (response.status === 401 && !window.location.pathname.includes('/login')) {
            localStorage.clear();
            window.location.href = '/login';
        }

        let errorMessage = 'Error desconocido en el servidor';
        if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } else {
            errorMessage = await response.text() || errorMessage;
        }

        const errorId = requestId.substring(0, 8).toUpperCase();
        toast.error(`${errorMessage}`, {
            description: `ErrorID: ${errorId} | Contáctanos si persiste.`,
            duration: 6000
        });
        throw new Error(`[Trace: ${requestId}] ${errorMessage}`);
    }

    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }
    return response;
};

export const api = {
    auth: {
        login: (credentials: LoginCredentials): Promise<AuthResponse> =>
            customFetch(`${API_URL}/auth/login`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            }).then(handleResponse),

        register: (data: RegisterData): Promise<AuthResponse> =>
            customFetch(`${API_URL}/auth/register`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }).then(handleResponse),

        getProfile: (): Promise<User> =>
            customFetch(`${API_URL}/auth/profile`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

        forgotPassword: (email: string): Promise<{ message: string }> =>
            customFetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            }).then(handleResponse),

        resetPassword: (token: string, newPassword: string): Promise<{ message: string }> =>
            customFetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword }),
            }).then(handleResponse),
    },

    clients: {
        getAll: (page: number = 1, limit: number = 10, search: string = ''): Promise<PaginatedResponse<Client>> =>
            customFetch(`${API_URL}/clients?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

        create: (client: Partial<Client>): Promise<Client> =>
            customFetch(`${API_URL}/clients`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(client),
            }).then(handleResponse),

        update: (id: number, client: Partial<Client>): Promise<Client> =>
            customFetch(`${API_URL}/clients/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(client),
            }).then(handleResponse),

        delete: (id: number): Promise<void> =>
            customFetch(`${API_URL}/clients/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            }).then(handleResponse),
    },

    opportunities: {
        getAll: (page: number = 1, limit: number = 10, search: string = ''): Promise<PaginatedResponse<Opportunity>> =>
            customFetch(`${API_URL}/opportunities?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

        create: (opportunity: Partial<Opportunity>): Promise<Opportunity> =>
            customFetch(`${API_URL}/opportunities`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(opportunity),
            }).then(handleResponse),

        updateStatus: (id: number, status: string): Promise<Opportunity> =>
            customFetch(`${API_URL}/opportunities/${id}/status`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ status }),
            }).then(handleResponse),
    },

    contacts: {
        getByClient: (clientId: number): Promise<Contact[]> =>
            customFetch(`${API_URL}/contacts/${clientId}`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

        create: (contact: Partial<Contact>): Promise<Contact> =>
            customFetch(`${API_URL}/contacts`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(contact),
            }).then(handleResponse),
    },

    tasks: {
        getAll: (): Promise<Task[]> =>
            customFetch(`${API_URL}/tasks`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

        create: (task: Partial<Task>): Promise<Task> =>
            customFetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(task),
            }).then(handleResponse),

        toggle: (id: number): Promise<Task> =>
            customFetch(`${API_URL}/tasks/${id}/toggle`, {
                method: 'PATCH',
                headers: getHeaders(),
            }).then(handleResponse),

        delete: (id: number): Promise<void> =>
            customFetch(`${API_URL}/tasks/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            }).then(handleResponse),
    },

    dashboard: {
        getMetrics: async (period: string = 'monthly'): Promise<{ totalSales: number, conversionRate: number, averageTicket: number, repPerformance: { id: number, name: string, total_sales: number, deals_won: number }[], chartData: { name: string, sales: number }[], _cached?: boolean }> => {
            const cacheKey = `metrics_${period}`;
            const cachedValue = dashboardCache.get(cacheKey);

            // Stale-while-revalidate pattern
            const fetchPromise = customFetch(`${API_URL}/dashboard/metrics?period=${period}`, { headers: getHeaders(), credentials: 'include' })
                .then(handleResponse)
                .then(data => {
                    dashboardCache.set(cacheKey, { data, timestamp: Date.now() });
                    // Emit event so the UI can softly update without loading spinners
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('dashboard_metrics_updated', { detail: { period, data } }));
                    }
                    return data;
                });

            if (cachedValue && (Date.now() - cachedValue.timestamp < 120000)) {
                // Return cached version
                const dataObj = cachedValue.data as { totalSales: number, conversionRate: number, averageTicket: number, repPerformance: { id: number, name: string, total_sales: number, deals_won: number }[], chartData: { name: string, sales: number }[] };
                return { ...dataObj, _cached: true };
            }

            return fetchPromise;
        }
    },

    ai: {
        getScore: (opportunityId: number): Promise<{ winProbability: number, leadScore: number }> =>
            customFetch(`${API_URL}/opportunities/${opportunityId}/score`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),
    },

    users: {
        getAll: (): Promise<User[]> =>
            customFetch(`${API_URL}/users`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

        updateRole: (id: number, role: string): Promise<User> =>
            customFetch(`${API_URL}/users/${id}/role`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ role })
            }).then(handleResponse),

        delete: (id: number): Promise<void> =>
            customFetch(`${API_URL}/users/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            }).then(handleResponse)
    },

    products: {
        getAll: (page: number = 1, limit: number = 10, search: string = ''): Promise<{ products: Product[], total: number, page: number, totalPages: number }> =>
            customFetch(`${API_URL}/products?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

        create: (product: Partial<Product>): Promise<Product> =>
            customFetch(`${API_URL}/products`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(product),
            }).then(handleResponse),

        update: (id: number, product: Partial<Product>): Promise<Product> =>
            customFetch(`${API_URL}/products/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(product),
            }).then(handleResponse),

        delete: (id: number): Promise<void> =>
            customFetch(`${API_URL}/products/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            }).then(handleResponse),
    },

    events: {
        getAll: (startDate?: string, endDate?: string): Promise<Event[]> => {
            const query = new URLSearchParams();
            if (startDate) query.append('startDate', startDate);
            if (endDate) query.append('endDate', endDate);
            return customFetch(`${API_URL}/events?${query.toString()}`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse);
        },

        create: (event: Partial<Event>): Promise<Event> =>
            customFetch(`${API_URL}/events`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(event),
            }).then(handleResponse),

        update: (id: number, event: Partial<Event>): Promise<Event> =>
            customFetch(`${API_URL}/events/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(event),
            }).then(handleResponse),

        delete: (id: number): Promise<void> =>
            customFetch(`${API_URL}/events/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            }).then(handleResponse),
    },

    documents: {
        getAll: (page: number = 1, limit: number = 10, search: string = ''): Promise<{ documents: Document[], total: number, page: number, totalPages: number }> =>
            customFetch(`${API_URL}/documents?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

        create: (document: Partial<Document>): Promise<Document> =>
            customFetch(`${API_URL}/documents`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(document),
            }).then(handleResponse),

        update: (id: number, document: Partial<Document>): Promise<Document> =>
            customFetch(`${API_URL}/documents/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(document),
            }).then(handleResponse),

        delete: (id: number): Promise<void> =>
            customFetch(`${API_URL}/documents/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            }).then(handleResponse),
    }
};
