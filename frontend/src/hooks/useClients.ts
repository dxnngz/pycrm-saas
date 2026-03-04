import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { Client } from '../types';

export const useClients = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
    });

    const loadClients = useCallback(async (page: number = 1, limit: number = 10, search: string = '') => {
        setLoading(true);
        try {
            const response = await api.clients.getAll(page, limit, search);
            
            if (response && Array.isArray(response.data)) {
                setClients(response.data);
                setPagination({
                    total: response.total || 0,
                    page: response.page || 1,
                    limit: response.limit || 10,
                    totalPages: response.totalPages || 0
                });
            } else if (Array.isArray(response)) {
                // Adaptación automática para arrays planos
                setClients(response);
                setPagination(prev => ({ ...prev, total: response.length, totalPages: 1 }));
            }
        } catch (error) {
            console.error('Error loading clients:', error);
            setClients([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const createClient = async (data: Partial<Client>) => {
        const newClient = await api.clients.create(data);
        setClients(prev => [...prev, newClient]);
        return newClient;
    };

    const updateClient = async (id: number, data: Partial<Client>) => {
        const updatedClient = await api.clients.update(id, data);
        setClients(prev => prev.map(c => c.id === id ? updatedClient : c));
        return updatedClient;
    };

    const deleteClient = async (id: number) => {
        await api.clients.delete(id);
        setClients(prev => prev.filter(c => c.id !== id));
    };

    return {
        clients,
        loading,
        pagination,
        loadClients,
        createClient,
        updateClient,
        deleteClient,
    };
};
