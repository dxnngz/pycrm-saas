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

export const getClientBrief = async (clientId: number) => {
    const response = await fetch(`${API_URL}/ai/client-brief/${clientId}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch client brief');
    }

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
