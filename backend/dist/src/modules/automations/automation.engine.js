import { eventBus } from '../../core/eventBus.js';
import { prisma } from '../../core/prisma.js';
import { taskService } from '../tasks/task.service.js';
// Add more imports for actions (emails, webhooks, etc.) as the system grows
export class AutomationEngine {
    constructor() {
        this.initializeListeners();
    }
    initializeListeners() {
        // Listen to all events emitted through the bus
        eventBus.onAny(async (eventName, value) => {
            const eventString = Array.isArray(eventName) ? eventName.join('.') : eventName;
            await this.handleEvent(eventString, value);
        });
        console.log(`[Automation Engine] Initialized and listening to events.`);
    }
    async handleEvent(eventName, payload) {
        if (!payload || !payload.tenantId)
            return;
        try {
            // Find active automations for this tenant that have a trigger for this event
            const automations = await prisma.automation.findMany({
                where: {
                    tenant_id: payload.tenantId,
                    active: true,
                    triggers: {
                        some: { event_name: eventName }
                    }
                },
                include: {
                    triggers: {
                        where: { event_name: eventName },
                        include: { conditions: true }
                    },
                    actions: {
                        orderBy: { order: 'asc' }
                    }
                }
            });
            for (const automation of automations) {
                // Determine if all conditions pass for at least one matched trigger
                let triggerPassed = false;
                for (const trigger of automation.triggers) {
                    if (this.evaluateConditions(trigger.conditions, payload.data)) {
                        triggerPassed = true;
                        break;
                    }
                }
                if (triggerPassed) {
                    await this.executeActions(automation.actions, payload);
                }
            }
        }
        catch (error) {
            console.error(`[Automation Engine] Error handling event ${eventName}:`, error);
        }
    }
    evaluateConditions(conditions, data) {
        // If no conditions, it's a pass-through trigger
        if (!conditions || conditions.length === 0)
            return true;
        for (const cond of conditions) {
            const fieldValue = this.getNestedValue(data, cond.field);
            const passed = this.compareValues(fieldValue, cond.operator, cond.value);
            if (!passed)
                return false; // ALL conditions must be met (AND logic implied)
        }
        return true;
    }
    compareValues(actual, operator, expected) {
        if (actual === undefined || actual === null)
            return false;
        const actualStr = String(actual).toLowerCase();
        const expectedStr = expected.toLowerCase();
        switch (operator) {
            case 'equals': return actualStr === expectedStr;
            case 'not_equals': return actualStr !== expectedStr;
            case 'contains': return actualStr.includes(expectedStr);
            case 'greater_than': return Number(actual) > Number(expected);
            case 'less_than': return Number(actual) < Number(expected);
            default: return false;
        }
    }
    getNestedValue(obj, path) {
        return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
    }
    async executeActions(actions, payload) {
        for (const action of actions) {
            try {
                switch (action.type) {
                    case 'create_task':
                        // Example Action: create a task linked to the triggering entity
                        await taskService.createTask({
                            userId: payload.userId || 1, // Fallback to an admin or system user
                            title: this.parseTemplate(action.payload.title || 'Automated Task', payload.data),
                            due_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                            priority: action.payload.priority || 'high',
                        }, payload.tenantId);
                        break;
                    case 'log':
                        console.log(`[Automation Action Log]`, this.parseTemplate(action.payload.message || 'Log triggered', payload.data));
                        break;
                    default:
                        console.warn(`[Automation Engine] Unknown action type: ${action.type}`);
                }
            }
            catch (err) {
                console.error(`[Automation Engine] Failed to execute action ${action.id}:`, err);
                // Decide if we should array break or continue
            }
        }
    }
    parseTemplate(template, data) {
        // Simple mustache-like replacer: {{client.name}}
        return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
            const val = this.getNestedValue(data, path.trim());
            return val !== undefined ? String(val) : '';
        });
    }
}
// Instantiate the singleton engine
export const automationEngine = new AutomationEngine();
