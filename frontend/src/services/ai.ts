import { customFetch, getHeaders, handleResponse } from './apiClient';

export const streamClientBrief = async (
    clientId: number,
    onMessage: (text: string) => void,
    onDone: () => void
) => {
    const response = await customFetch(`/ai/client-brief/${clientId}`, { headers: getHeaders() });
    if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        const msg = contentType.includes('application/json') ? (await response.json())?.message : await response.text();
        throw new Error(msg || 'No se pudo generar el briefing');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No se pudo iniciar el streaming');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (!line.trim().startsWith('data: ')) continue;
            const dataStr = line.substring(6).trim();
            if (!dataStr || dataStr === '[DONE]') continue;
            try {
                const json = JSON.parse(dataStr);
                if (json.error) throw new Error(json.error);
                if (json.text) onMessage(json.text);
                if (json.done) onDone();
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Error leyendo el streaming';
                throw new Error(msg);
            }
        }
    }
};

export const getSmartAlerts = async () =>
    customFetch('/ai/alerts', { headers: getHeaders() }).then(handleResponse);

export const getOpportunityScore = async (opportunityId: number) =>
    customFetch(`/ai/opportunity-score/${opportunityId}`, { headers: getHeaders() }).then(handleResponse);

export const getExecutiveBriefing = async () =>
    customFetch('/ai/executive-briefing', { headers: getHeaders() }).then(handleResponse);
