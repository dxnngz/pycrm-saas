import { useQuery } from '@tanstack/react-query';
import { tenantService } from '../services/tenant.service';

export const useTenantPlan = () => {
    return useQuery({
        queryKey: ['tenant_plan'],
        queryFn: () => tenantService.getMyPlan(),
        staleTime: 60_000,
    });
};

