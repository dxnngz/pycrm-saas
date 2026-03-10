import { prisma } from '../../core/prisma.js';
import { events } from '../../core/events.js';

export class WorkflowService {
    constructor() {
        this.initializeListeners();
    }

    private initializeListeners() {
        // Listen to all workflow events and route them to the engine
        const self = this;
        events.on('workflow:*', async function (this: any, payload: any) {
            const eventName = this.event;
            if (typeof eventName === 'string' && payload && typeof payload === 'object') {
                await self.processEvent(eventName, payload);
            }
        });
    }

    private async processEvent(eventName: string, payload: any) {
        const { tenantId, userId, data } = payload;
        if (!tenantId) return;

        // 1. Fetch active automations for this tenant and event
        const automations = await prisma.automation.findMany({
            where: {
                tenant_id: tenantId,
                active: true,
                triggers: {
                    some: { event_name: eventName }
                }
            },
            include: {
                triggers: {
                    include: { conditions: true }
                },
                actions: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        for (const automation of automations) {
            for (const trigger of automation.triggers) {
                if (trigger.event_name === eventName && this.checkConditions(trigger.conditions, data)) {
                    await this.executeActions(automation.actions, payload);
                }
            }
        }
    }

    private checkConditions(conditions: any[], data: any): boolean {
        if (!conditions || conditions.length === 0) return true;

        return conditions.every(condition => {
            const actualValue = data[condition.field];
            switch (condition.operator) {
                case 'equals': return actualValue == condition.value;
                case 'not_equals': return actualValue != condition.value;
                case 'greater_than': return Number(actualValue) > Number(condition.value);
                case 'less_than': return Number(actualValue) < Number(condition.value);
                case 'contains': return String(actualValue).includes(condition.value);
                default: return false;
            }
        });
    }

    private async executeActions(actions: any[], payload: any) {
        for (const action of actions) {
            try {
                switch (action.type) {
                    case 'create_task':
                        await this.handleCreateTask(action.payload, payload);
                        break;
                    case 'send_email':
                        // Placeholder for enterprise email service
                        console.info(`[Workflow] Sending email to ${action.payload.to} for tenant ${payload.tenantId}`);
                        break;
                    // Add more enterprise actions here (Slack, Webhooks, etc.)
                }
            } catch (error) {
                console.error(`[Workflow Engine] Error executing action ${action.type}:`, error);
            }
        }
    }

    private async handleCreateTask(actionPayload: any, eventPayload: any) {
        const { tenantId, userId } = eventPayload;
        await prisma.task.create({
            data: {
                tenant_id: tenantId,
                user_id: userId,
                title: actionPayload.title || 'Tarea Automática',
                deadline: new Date(Date.now() + (actionPayload.daysDelay || 1) * 24 * 60 * 60 * 1000),
                priority: actionPayload.priority || 'Media'
            }
        });
    }
}

export const workflowService = new WorkflowService();
