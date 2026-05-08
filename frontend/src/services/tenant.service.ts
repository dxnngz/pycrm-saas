import { customFetch, getHeaders, handleResponse } from './apiClient';

export interface TenantPlanInfo {
    plan: string;
    limits?: Record<string, unknown>;
    settings?: Record<string, unknown>;
}

export const tenantService = {
    getMyPlan: async (): Promise<TenantPlanInfo> => {
        const data = await customFetch('/tenants/my-plan', { headers: getHeaders() }).then(handleResponse);
        return data as TenantPlanInfo;
    },
    updateSettings: async (settings: Record<string, unknown>): Promise<{ settings?: Record<string, unknown> }> => {
        const data = await customFetch('/tenants/settings', {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ settings })
        }).then(handleResponse);
        return data as { settings?: Record<string, unknown> };
    },
};

