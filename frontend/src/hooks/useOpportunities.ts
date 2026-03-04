import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { Opportunity } from '../types';

export const useOpportunities = () => {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
    });

    const loadOpportunities = useCallback(async (page: number = 1, limit: number = 10, search: string = '') => {
        setLoading(true);
        try {
            const response = await api.opportunities.getAll(page, limit, search);
            
            if (response && Array.isArray(response.data)) {
                setOpportunities(response.data);
                setPagination({
                    total: response.total || 0,
                    page: response.page || 1,
                    limit: response.limit || 10,
                    totalPages: response.totalPages || 0
                });
            } else if (Array.isArray(response)) {
                // Adaptación automática para arrays planos
                setOpportunities(response);
                setPagination(prev => ({ ...prev, total: response.length, totalPages: 1 }));
            }
        } catch (error) {
            console.error('Error loading opportunities:', error);
            setOpportunities([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const createOpportunity = async (data: Partial<Opportunity>) => {
        const newOpp = await api.opportunities.create(data);
        setOpportunities(prev => [...prev, newOpp]);
        return newOpp;
    };

    const updateOpportunityStatus = async (id: number, status: 'pendiente' | 'ganado' | 'perdido') => {
        await api.opportunities.updateStatus(id, status);
        setOpportunities(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    };

    return {
        opportunities,
        loading,
        pagination,
        loadOpportunities,
        createOpportunity,
        updateOpportunityStatus,
    };
};
