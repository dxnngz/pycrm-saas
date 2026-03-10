import { events } from '../events.js';
import { redisCache } from '../redis.js';

export const initCacheSubscriber = () => {
    // Client invalidation
    events.on('workflow:client_*', async (payload: { tenantId: number }) => {
        if (payload.tenantId) {
            await redisCache.invalidateTenantCache(payload.tenantId, 'clients');
            console.info(`[CacheSubscriber] Invalidated client cache for tenant ${payload.tenantId}`);
        }
    });

    // Opportunity invalidation
    events.on('workflow:opportunity_*', async (payload: { tenantId: number }) => {
        if (payload.tenantId) {
            await redisCache.invalidateTenantCache(payload.tenantId, 'opportunities');
            // Dashboard also depends on opportunities
            await redisCache.invalidateTenantCache(payload.tenantId, 'dashboard');
            console.info(`[CacheSubscriber] Invalidated opportunity/dashboard cache for tenant ${payload.tenantId}`);
        }
    });

    // Dashboard-specific (if any other events trigger it)
    events.on('workflow:dashboard_refresh', async (payload: { tenantId: number }) => {
        if (payload.tenantId) {
            await redisCache.invalidateTenantCache(payload.tenantId, 'dashboard');
        }
    });

    console.log('[CacheSubscriber] Active and listening for cache invalidation events.');
};
