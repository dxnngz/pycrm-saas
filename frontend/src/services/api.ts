import { authService } from './auth.service';
import { clientService } from './client.service';
import { opportunityService } from './opportunity.service';
import { taskService } from './task.service';
import { dashboardService } from './dashboard.service';
import { customFetch, getHeaders, handleResponse } from './apiClient';

// Export for backward compatibility during transition
export const api = {
    auth: authService,
    clients: clientService,
    opportunities: opportunityService,
    tasks: taskService,
    dashboard: dashboardService,
    // Add any minor ones left or placeholders
    contacts: {
        getByClient: (clientId: number) => customFetch(`/contacts/${clientId}`, { headers: getHeaders() }).then(handleResponse),
        create: (contact: any) => customFetch('/contacts', { method: 'POST', headers: getHeaders(), body: JSON.stringify(contact) }).then(handleResponse),
    },
    ai: {
        askCopilot: (query: string) => customFetch('/ai/copilot', { method: 'POST', headers: getHeaders(), body: JSON.stringify({ query }) }).then(handleResponse),
        // ... streamline other AI methods similarly
    },
    users: {
        getAll: () => customFetch('/users', { headers: getHeaders() }).then(handleResponse),
        updateRole: (id: number, role: string) => customFetch(`/users/${id}/role`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ role }) }).then(handleResponse),
        delete: (id: number) => customFetch(`/users/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
    }
};
