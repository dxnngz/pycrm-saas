import { AsyncLocalStorage } from 'async_hooks';

export const contextStore = new AsyncLocalStorage<{ userId?: number, tenantId?: number, isSystem?: boolean, requestId?: string }>();
