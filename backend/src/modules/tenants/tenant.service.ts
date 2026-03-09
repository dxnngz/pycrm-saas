import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PlanLimits {
    maxUsers: number;
    maxClients: number;
    maxOpportunities: number;
    aiBriefsEnabled: boolean;
    workflowAutomationsEnabled: boolean;
}

const PLAN_CONFIGURATIONS: Record<string, PlanLimits> = {
    free: {
        maxUsers: 2,
        maxClients: 50,
        maxOpportunities: 10,
        aiBriefsEnabled: false,
        workflowAutomationsEnabled: false,
    },
    pro: {
        maxUsers: 10,
        maxClients: 500,
        maxOpportunities: 200,
        aiBriefsEnabled: true,
        workflowAutomationsEnabled: true,
    },
    enterprise: {
        maxUsers: 999,
        maxClients: 9999,
        maxOpportunities: 9999,
        aiBriefsEnabled: true,
        workflowAutomationsEnabled: true,
    },
};

export class TenantService {
    async getTenantPlan(tenantId: number) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { plan: true, settings: true }
        });

        if (!tenant) throw new Error('Tenant not found');

        const plan = (tenant.plan as keyof typeof PLAN_CONFIGURATIONS) || 'free';
        return {
            plan,
            limits: PLAN_CONFIGURATIONS[plan],
            settings: tenant.settings
        };
    }

    async checkLimit(tenantId: number, resource: 'users' | 'clients' | 'opportunities') {
        const { limits } = await this.getTenantPlan(tenantId);

        let currentCount = 0;
        switch (resource) {
            case 'users':
                currentCount = await prisma.user.count({ where: { tenant_id: tenantId } });
                if (currentCount >= limits.maxUsers) return false;
                break;
            case 'clients':
                currentCount = await prisma.client.count({ where: { tenant_id: tenantId, deleted_at: null } });
                if (currentCount >= limits.maxClients) return false;
                break;
            case 'opportunities':
                currentCount = await prisma.opportunity.count({ where: { tenant_id: tenantId, deleted_at: null } });
                if (currentCount >= limits.maxOpportunities) return false;
                break;
        }

        return true;
    }

    async isFeatureEnabled(tenantId: number, feature: 'aiBriefs' | 'workflows') {
        const { limits } = await this.getTenantPlan(tenantId);
        if (feature === 'aiBriefs') return limits.aiBriefsEnabled;
        if (feature === 'workflows') return limits.workflowAutomationsEnabled;
        return false;
    }
}

export const tenantService = new TenantService();
