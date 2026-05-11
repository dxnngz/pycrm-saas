import { useQuery } from '@tanstack/react-query';
import { opportunityService } from '../services/opportunity.service';
import type { OpportunityFilters } from './useOpportunities';

export const useOpportunitySummary = (search: string = '', filters: OpportunityFilters = {}) => {
    return useQuery({
        queryKey: [
            'opportunity_summary',
            search,
            filters.status ?? '',
            filters.assigned_to ?? 0,
            filters.amount_min ?? '',
            filters.amount_max ?? '',
            filters.overdue ? 1 : 0
        ],
        queryFn: () => opportunityService.getSummary({ search, ...filters }),
        placeholderData: (previous) => previous
    });
};
