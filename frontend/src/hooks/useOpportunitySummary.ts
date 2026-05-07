import { useQuery } from '@tanstack/react-query';
import { opportunityService } from '../services/opportunity.service';

export const useOpportunitySummary = (search: string = '') => {
    return useQuery({
        queryKey: ['opportunity_summary', search],
        queryFn: () => opportunityService.getSummary(search),
        placeholderData: (previous) => previous
    });
};

