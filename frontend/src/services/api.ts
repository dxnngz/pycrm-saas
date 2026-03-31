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
        askCopilotStream: async (query: string, onChunk: (chunk: string) => void, onDone: () => void, onError: (error: string) => void) => {
            try {
                const response = await customFetch('/ai/copilot', {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({ query })
                });

                if (!response.ok) {
                    throw new Error('Stream failed or Unauthorized');
                }

                const reader = response.body?.getReader();
                const decoder = new TextDecoder();

                if (!reader) throw new Error('No reader available');

                let buffer = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.trim().startsWith('data: ')) {
                            const dataStr = line.substring(6).trim();
                            if (!dataStr || dataStr === '[DONE]') continue;
                            
                            try {
                                const data = JSON.parse(dataStr);
                                if (data.text) {
                                    onChunk(data.text);
                                } else if (data.done) {
                                    onDone();
                                } else if (data.error) {
                                    onError(data.error);
                                }
                            } catch (e) {
                                console.warn('Pares invalid chunk', dataStr);
                            }
                        }
                    }
                }
                
                if (buffer.trim().startsWith('data: ')) {
                    try {
                        const data = JSON.parse(buffer.substring(6).trim());
                        if (data.text) onChunk(data.text);
                        if (data.done) onDone();
                    } catch (e) {}
                }
            } catch (error: any) {
                onError(error.message || 'Stream error');
            }
        },
        // ... streamline other AI methods similarly
    },
    users: {
        getAll: () => customFetch('/users', { headers: getHeaders() }).then(handleResponse),
        updateRole: (id: number, role: string) => customFetch(`/users/${id}/role`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ role }) }).then(handleResponse),
        delete: (id: number) => customFetch(`/users/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
    }
};
