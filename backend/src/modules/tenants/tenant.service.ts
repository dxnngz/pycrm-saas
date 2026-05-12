import { prisma } from '../../core/prisma.js';
import { AppError } from '../../utils/AppError.js';

export interface PlanLimits {
    maxUsers: number;
    maxClients: number;
    maxOpportunities: number;
    aiBriefsEnabled: boolean;
    workflowAutomationsEnabled: boolean;
}

export type PipelineStageCategory = 'open' | 'won' | 'lost';

export interface PipelineStage {
    id: string;
    label: string;
    category: PipelineStageCategory;
    order: number;
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

const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
    { id: 'pendiente', label: 'Pendiente', category: 'open', order: 10 },
    { id: 'negociacion', label: 'Negociación', category: 'open', order: 20 },
    { id: 'ganado', label: 'Ganado', category: 'won', order: 90 },
    { id: 'perdido', label: 'Perdido', category: 'lost', order: 100 },
];

const normalizePipelineStages = (value: unknown): PipelineStage[] => {
    if (!Array.isArray(value)) return [];
    const stages: PipelineStage[] = [];
    for (let i = 0; i < value.length; i++) {
        const raw = value[i] as any;
        const id = typeof raw?.id === 'string' ? raw.id.trim() : '';
        const label = typeof raw?.label === 'string' ? raw.label.trim() : '';
        const category = raw?.category;
        const order = typeof raw?.order === 'number' ? raw.order : i * 10;

        if (!id || !label) continue;
        if (category !== 'open' && category !== 'won' && category !== 'lost') continue;
        stages.push({ id, label, category, order });
    }

    const dedup = new Map<string, PipelineStage>();
    for (const s of stages) {
        if (!dedup.has(s.id)) dedup.set(s.id, s);
    }

    return Array.from(dedup.values()).sort((a, b) => a.order - b.order);
};

const coerceTenantId = (tenantId: unknown): number => {
    const tid = Number(tenantId);
    if (!tid || Number.isNaN(tid)) {
        throw new AppError('Tenant inválido.', 400);
    }
    return tid;
};

export class TenantService {
    async getTenantPlan(tenantId: number) {
        const tid = coerceTenantId(tenantId);
        const tenant = await prisma.tenant.findUnique({
            where: { id: tid },
            select: { plan: true, settings: true }
        });

        if (!tenant) throw new AppError('Tenant no encontrado.', 404);

        const plan = (tenant.plan as keyof typeof PLAN_CONFIGURATIONS) || 'free';
        return {
            plan,
            limits: PLAN_CONFIGURATIONS[plan],
            settings: tenant.settings
        };
    }

    async getPipelineStages(tenantId: number): Promise<PipelineStage[]> {
        const tid = coerceTenantId(tenantId);
        const tenant = await prisma.tenant.findUnique({
            where: { id: tid },
            select: { settings: true }
        });
        const settings = (tenant?.settings || {}) as Record<string, unknown>;
        const stages = normalizePipelineStages((settings as any).pipelineStages);
        return stages.length > 0 ? stages : DEFAULT_PIPELINE_STAGES;
    }

    async getPipelineStatusSets(tenantId: number): Promise<{ open: string[]; won: string[]; lost: string[]; closed: string[]; all: string[] }> {
        const stages = await this.getPipelineStages(coerceTenantId(tenantId));
        const open = stages.filter(s => s.category === 'open').map(s => s.id);
        const won = Array.from(new Set([...stages.filter(s => s.category === 'won').map(s => s.id), 'ganada']));
        const lost = Array.from(new Set([...stages.filter(s => s.category === 'lost').map(s => s.id), 'perdida']));

        const closed = Array.from(new Set([...won, ...lost]));
        const all = Array.from(new Set([...open, ...won, ...lost]));

        return { open, won, lost, closed, all };
    }

    async checkLimit(tenantId: number, resource: 'users' | 'clients' | 'opportunities') {
        const tid = coerceTenantId(tenantId);
        const { limits } = await this.getTenantPlan(tid);

        let currentCount = 0;
        switch (resource) {
            case 'users':
                currentCount = await prisma.user.count({ where: { tenant_id: tid } });
                if (currentCount >= limits.maxUsers) return false;
                break;
            case 'clients':
                currentCount = await prisma.client.count({ where: { tenant_id: tid, deleted_at: null } });
                if (currentCount >= limits.maxClients) return false;
                break;
            case 'opportunities':
                currentCount = await prisma.opportunity.count({ where: { tenant_id: tid, deleted_at: null } });
                if (currentCount >= limits.maxOpportunities) return false;
                break;
        }

        return true;
    }

    async isFeatureEnabled(tenantId: number, feature: 'aiBriefs' | 'workflows') {
        const { limits } = await this.getTenantPlan(coerceTenantId(tenantId));
        if (feature === 'aiBriefs') return limits.aiBriefsEnabled;
        if (feature === 'workflows') return limits.workflowAutomationsEnabled;
        return false;
    }
}

export const tenantService = new TenantService();
