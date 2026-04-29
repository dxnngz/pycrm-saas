import { toast } from 'sonner';
import { captureRUMMetrics, getMemoryUsage } from '../utils/metrics';
import { sanitizePayload } from '../utils/security';

const normalizeApiBase = (url?: string): string => {
    if (!url) return '';
    const trimmed = url.replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const explicitApiBase = normalizeApiBase(import.meta.env.VITE_API_URL);
const API_URL = explicitApiBase || (import.meta.env.PROD ? '/api' : 'http://localhost:10000/api');

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
    refreshSubscribers.forEach(cb => cb(token));
    refreshSubscribers = [];
};

const getCsrfToken = () => {
    const localToken = localStorage.getItem('csrfToken');
    if (localToken) return localToken;
    const csrfMatch = document.cookie.match(/csrfToken=([^;]+)/);
    return csrfMatch ? csrfMatch[1] : '';
};

export const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const csrfToken = getCsrfToken();
    if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
    }

    return headers;
};

export const customFetch = async (url: string, options?: RequestInit, retries = 1): Promise<Response> => {
    const start = performance.now();
    const requestId = 'req-' + Math.random().toString(36).substring(7);

    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
    const headers = new Headers(options?.headers);
    headers.set('X-Request-Id', requestId);

    let body = options?.body;
    if (body && typeof body === 'string' && (options?.method === 'POST' || options?.method === 'PUT' || options?.method === 'PATCH')) {
        try {
            const parsedBody = JSON.parse(body);
            const sanitizedBody = sanitizePayload(parsedBody);
            body = JSON.stringify(sanitizedBody);
        } catch { /* ignore non-json strings */ }
    }

    const finalOptions: RequestInit = {
        credentials: 'include',
        ...options,
        headers,
        body
    };

    try {
        const response = await fetch(fullUrl, finalOptions);
        const duration = performance.now() - start;

        captureRUMMetrics({
            latencyMs: duration,
            endpoint: url,
            method: finalOptions?.method || 'GET',
            status: response.status,
            requestID: requestId,
            timestamp: new Date().toISOString(),
            jsHeapSizeMB: getMemoryUsage()
        });

        (response as Response & { __requestId?: string }).__requestId = requestId;

        if (!response.ok) {
            if (response.status === 401 && !window.location.pathname.includes('/login')) {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
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
                            if (data.csrfToken) {
                                localStorage.setItem('csrfToken', data.csrfToken);
                            }
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
                return new Promise(resolve => setTimeout(resolve, 1000)).then(() => customFetch(url, options, retries - 1));
            }
        }

        return response;
    } catch (error) {
        if (retries > 0) {
            return new Promise(resolve => setTimeout(resolve, 1500)).then(() => customFetch(url, options, retries - 1));
        }
        throw error;
    }
};

export const handleResponse = async (response: Response) => {
    const contentType = response.headers.get('content-type');
    const requestId = (response as Response & { __requestId?: string }).__requestId || 'local-fallback';

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.clear();
            window.location.reload();
        }

        let errorMessage = 'Error desconocido en el servidor';
        if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } else {
            errorMessage = await response.text() || errorMessage;
        }

        toast.error(errorMessage, {
            description: `ErrorID: ${requestId.substring(0, 8).toUpperCase()}`
        });
        throw new Error(errorMessage);
    }

    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }
    return response;
};
