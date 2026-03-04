import cron from 'node-cron';
import { prisma } from '../core/prisma.js';
import { aiService } from '../modules/ai/ai.service.js';
import { taskService } from '../modules/tasks/task.service.js';

class CommercialIntelligenceJob {

    public init() {
        // Runs every day at 00:00 midnight UTC
        cron.schedule('0 0 * * *', async () => {
            console.log('[CRON] Starting Daily Commercial Intelligence Job...');
            await this.runIntelligenceScan();
            console.log('[CRON] Finished Daily Commercial Intelligence Job.');
        });
        console.log('[CRON] Registered Commercial Intelligence Schedule (Daily at 00:00).');
    }

    private async runIntelligenceScan() {
        try {
            const tenants = await prisma.tenant.findMany({ select: { id: true } });

            for (const tenant of tenants) {
                await this.analyzeStuckOpportunities(tenant.id);
                await this.analyzeNeglectedClients(tenant.id);
            }
        } catch (error) {
            console.error('[CRON] Error during commercial intelligence scan:', error);
        }
    }

    private async analyzeStuckOpportunities(tenantId: number) {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - 14); // 14 days ago

        const stuckOpps = await prisma.opportunity.findMany({
            where: {
                tenant_id: tenantId,
                status: 'negociacion',
                // For a real scenario we'd use 'updated_at', here we fallback to created if updated not tracked explicitly
                created_at: { lt: thresholdDate }
            },
            include: { client: true }
        });

        for (const opp of stuckOpps) {
            // Auto-generate an intelligence task for the owner or a default admin
            const title = `[AI Alert] Oportunidad Estancada: ${opp.product} con ${opp.client?.company}`;

            const existingTask = await prisma.task.findFirst({
                where: { tenant_id: tenantId, title, completed: false }
            });

            if (!existingTask) {
                await taskService.createTask({
                    userId: opp.assigned_to || 1,
                    title,
                    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                    priority: 'Alta',
                    client_id: String(opp.client_id)
                }, tenantId);
                console.log(`[CRON] Created stuck opportunity task for Ops: ${opp.id} (Tenant ${tenantId})`);
            }
        }
    }

    private async analyzeNeglectedClients(tenantId: number) {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - 30); // 30 days ago

        // Clients with no interaction in the last 30 days
        const neglectedClients = await prisma.client.findMany({
            where: {
                tenant_id: tenantId,
                status: 'activo',
                contacts: {
                    none: { contact_date: { gt: thresholdDate } }
                }
            }
        });

        for (const client of neglectedClients) {
            const title = `[AI Alert] Cliente Desatendido: ${client.company} (Sin contacto > 30 días)`;

            const existingTask = await prisma.task.findFirst({
                where: { tenant_id: tenantId, title, completed: false }
            });

            if (!existingTask) {
                await taskService.createTask({
                    userId: 1, // Fallback to main user
                    title,
                    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
                    priority: 'Media',
                    client_id: String(client.id)
                }, tenantId);
                console.log(`[CRON] Created neglected client task: ${client.id} (Tenant ${tenantId})`);
            }
        }
    }
}

export const commercialIntelligenceJob = new CommercialIntelligenceJob();
