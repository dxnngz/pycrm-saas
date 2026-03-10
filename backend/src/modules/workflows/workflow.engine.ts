import { Queue, Worker, Job } from 'bullmq';
import { redisCache } from '../../core/redis.js';
import { logger } from '../../utils/logger.js';
import { events } from '../../core/events.js';
import { prisma } from '../../core/prisma.js';
import { aiService } from '../ai/ai.service.js';

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

// Main Workflow Queue
export const workflowQueue = new Queue('workflow-queue', { connection });

/**
 * Workflow Engine Class
 * Bridges application events to automated actions.
 */
export class WorkflowEngine {
    private worker: Worker;

    constructor() {
        this.worker = new Worker('workflow-queue', async (job: Job) => {
            await this.processJob(job);
        }, { connection });

        this.worker.on('failed', (job, err) => {
            logger.error({ jobId: job?.id, err }, 'Workflow Job Failed');
        });

        // Bridge EventEmitter2 to BullMQ
        events.on('workflow:*', (data: { tenantId: number, event: string, payload: any }) => {
            this.triggerWorkflows(data.tenantId, data.event, data.payload);
        });
    }

    private async triggerWorkflows(tenantId: number, eventName: string, payload: any) {
        // Find matching active automations for this event
        const automations = await prisma.automation.findMany({
            where: {
                tenant_id: tenantId,
                active: true,
                triggers: {
                    some: { event_name: eventName }
                }
            },
            include: {
                actions: { orderBy: { order: 'asc' } },
                triggers: {
                    include: { conditions: true }
                }
            }
        });

        for (const automation of automations) {
            // Check conditions for each trigger
            const trigger = automation.triggers.find((t: any) => t.event_name === eventName);
            if (!trigger) continue;

            const conditionsMet = trigger.conditions.every((condition: any) => {
                const fieldValue = payload[condition.field];
                switch (condition.operator) {
                    case 'equals': return String(fieldValue) === condition.value;
                    case 'not_equals': return String(fieldValue) !== condition.value;
                    case 'greater_than': return Number(fieldValue) > Number(condition.value);
                    case 'less_than': return Number(fieldValue) < Number(condition.value);
                    default: return false;
                }
            });

            if (conditionsMet) {
                await workflowQueue.add(`${automation.name}-${Date.now()}`, {
                    automationId: automation.id,
                    tenantId,
                    payload,
                    actions: automation.actions
                });
            }
        }
    }

    private async processJob(job: Job) {
        const { actions, tenantId, payload } = job.data;
        logger.info({ automationId: job.data.automationId, tenantId }, 'Processing Workflow actions');

        for (const action of actions) {
            try {
                await this.executeAction(action, tenantId, payload);
            } catch (err: any) {
                logger.error({ actionId: action.id, err: err.message }, 'Failed to execute workflow action');
            }
        }
    }

    private async executeAction(action: any, tenantId: number, payload: any) {
        switch (action.type) {
            case 'create_task':
                await prisma.task.create({
                    data: {
                        tenant_id: tenantId,
                        title: this.parseTemplate(action.payload.title, payload),
                        user_id: action.payload.userId || payload.userId,
                        priority: action.payload.priority || 'Alta'
                    }
                });
                break;
            case 'send_notification':
                // Simple log for now
                logger.info({ tenantId, msg: action.payload.message }, 'Workflow: Sending Notification');
                break;
            case 'calculate_ai_score':
                if (payload.data?.id) {
                    const score = await aiService.calculateLeadScore(payload.data.id, tenantId);
                    logger.info({ opportunityId: payload.data.id, score: score.score }, 'Workflow: AI Lead Score Calculated');
                }
                break;
            default:
                logger.warn({ type: action.type }, 'Unknown action type in workflow');
        }
    }

    private parseTemplate(template: string, data: any) {
        return template.replace(/\{\{(.*?)\}\}/g, (_, key) => data[key.trim()] || '');
    }
}

export const workflowEngine = new WorkflowEngine();
