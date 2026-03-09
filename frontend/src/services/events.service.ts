// Service for Calendar events API
import { customFetch, getHeaders, handleResponse } from './apiClient';

export const eventsService = {
    // Fetch events between two ISO date strings
    getAll: async (startDate: string, endDate: string) =>
        customFetch(`/events?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`, {
            headers: getHeaders(),
        }).then(handleResponse),

    // Delete an event by ID
    delete: async (id: number) =>
        customFetch(`/events/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        }).then(handleResponse),
};
