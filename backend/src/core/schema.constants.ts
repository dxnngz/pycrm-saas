/**
 * Unified Schema Mapping for PyCRM Elite.
 * Centralizing table names and model groups to prevent pluralization bugs.
 */

export const TABLE_MAP: Record<string, string> = {
    'Tenant': 'tenants',
    'User': 'users',
    'Client': 'clients',
    'Contact': 'contacts',
    'Opportunity': 'opportunities',
    'Task': 'tasks',
    'Event': 'events',
    'Product': 'products',
    'Document': 'documents',
    'AuditLog': 'audit_logs',
    'Automation': 'automations',
    'Trigger': 'triggers',
    'Condition': 'conditions',
    'Action': 'actions',
    'RefreshToken': 'refresh_tokens',
    'PasswordReset': 'password_resets'
};

export const AUDITABLE_MODELS = ['Client', 'Opportunity', 'Contact', 'Task', 'Event', 'Document', 'Product', 'User'];

export const VERSIONED_MODELS = [
    'Client', 'Opportunity', 'Contact', 'Task', 'Event', 'Document',
    'Product', 'User', 'Automation', 'Trigger', 'Condition', 'Action'
];

/**
 * Models that require strict multi-tenant isolation via tenant_id.
 */
export const TENANT_SCOPED_MODELS = [
    'User', 'Client', 'Contact', 'Opportunity', 'Task',
    'Event', 'Product', 'Document', 'AuditLog', 'Automation'
];

/**
 * Helper to get the physical table name from a Prisma model name.
 */
export function getTableName(modelName: string): string {
    return TABLE_MAP[modelName] || `${modelName.toLowerCase()}s`;
}
