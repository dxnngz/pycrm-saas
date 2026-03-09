const API_URL = import.meta.env.VITE_API_URL || '/api';

const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export const streamClientBrief = async (clientId: number, onMessage: (text: string) => void, onDone: () => void) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/ai/client-brief/${clientId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error('Failed to stream brief');

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const json = JSON.parse(line.substring(6));
                if (json.text) onMessage(json.text);
                if (json.done) onDone();
            }
        }
    }
};

export const getSmartAlerts = async () => {
    const response = await fetch(`${API_URL}/ai/alerts`, {
        headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch smart alerts');
    return response.json();
};

export const getOpportunityScore = async (opportunityId: number) => {
    const response = await fetch(`${API_URL}/ai/opportunity-score/${opportunityId}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch opportunity score');
    }

    return response.json();
};
