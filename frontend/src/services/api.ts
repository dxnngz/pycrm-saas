import { authService } from './auth.service';
import { clientService } from './client.service';
import { opportunityService } from './opportunity.service';
import { taskService } from './task.service';
import { dashboardService } from './dashboard.service';
import { eventsService } from './events.service';
import { documentsService } from './documents.service';
import { productsService } from './products.service';
import { customFetch, getHeaders, handleResponse } from './apiClient';

// Export for backward compatibility during transition
export const api = {
    auth: authService,
    clients: clientService,
    opportunities: opportunityService,
    tasks: taskService,
    dashboard: dashboardService, // Now refers to the inline defined dashboardService
    events: eventsService,
    documents: documentsService,
    products: productsService,
    // Add any minor ones left or placeholders
    contacts: {
        getByClient: (clientId: number) => customFetch(`/contacts/${clientId}`, { headers: getHeaders() }).then(handleResponse),
        create: (contact: { name?: string; email?: string; phone?: string; role?: string; client_id: number | string; type?: string; description?: string; contact_date?: string }) => customFetch('/contacts', { method: 'POST', headers: getHeaders(), body: JSON.stringify(contact) }).then(handleResponse),
    },
    ai: {
        askCopilot: (query: string) => customFetch('/ai/copilot', { method: 'POST', headers: getHeaders(), body: JSON.stringify({ query }) }).then(handleResponse),
        askCopilotStream: (query: string, onChunk: (chunk: string) => void, onDone: () => void, onError: (error: string) => void) => {
            const eventSource = new EventSource(`/ai/copilot/stream?query=${encodeURIComponent(query)}`);
            eventSource.onmessage = (e) => onChunk(e.data);
            eventSource.onerror = () => { onError('Stream error'); eventSource.close(); };
            eventSource.addEventListener('end', () => { onDone(); eventSource.close(); });
        },
        // ... streamline other AI methods similarly
    },
    users: {
        getAll: () => customFetch('/users', { headers: getHeaders() }).then(handleResponse),
        updateRole: (id: number, role: string) => customFetch(`/users/${id}/role`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ role }) }).then(handleResponse),
        delete: (id: number) => customFetch(`/users/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
    }
};
