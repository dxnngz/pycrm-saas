import { createClient } from 'redis';
import { redisCacheHits, redisCacheMisses } from './metrics.js';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
class RedisClient {
    client;
    constructor() {
        this.client = createClient({ url: REDIS_URL });
        this.client.on('error', (err) => console.error('Redis Client Error', err));
        // No bloqueamos el hilo principal si Redis no está levantado, ni en tests
        if (process.env.NODE_ENV !== 'test') {
            this.client.connect().catch((e) => {
                console.warn('⚠️ No se pudo conectar a Redis. Pasando a fallback in-memory (bypass de caché).', e.message);
            });
        }
    }
    async getOrSet(key, ttlSeconds, fetcher) {
        if (!this.client.isOpen) {
            return await fetcher();
        }
        try {
            const cachedValue = await this.client.get(key);
            if (cachedValue) {
                this.client.incr('system:cache:hits').catch(() => { });
                const entityName = key.split(':')[1] || 'unknown';
                redisCacheHits.inc({ entity: entityName });
                return JSON.parse(cachedValue);
            }
            const freshData = await fetcher();
            this.client.incr('system:cache:misses').catch(() => { });
            const entityName = key.split(':')[1] || 'unknown';
            redisCacheMisses.inc({ entity: entityName });
            await this.client.setEx(key, ttlSeconds, JSON.stringify(freshData));
            return freshData;
        }
        catch (error) {
            console.error(`Error en caché Redis para llave ${key}:`, error);
            return await fetcher(); // Fallback a la base de datos si Redis falla
        }
    }
    async invalidate(pattern) {
        if (!this.client.isOpen)
            return;
        try {
            let cursor = 0;
            do {
                const result = await this.client.scan(cursor, {
                    MATCH: pattern,
                    COUNT: 500
                });
                cursor = result.cursor;
                if (result.keys.length > 0) {
                    await this.client.unlink(result.keys);
                    console.info(`[Redis] Unlinked ${result.keys.length} keys matching pattern: ${pattern}`);
                }
            } while (cursor !== 0);
        }
        catch (error) {
            console.error(`Error invalidando caché Redis para ${pattern}:`, error);
        }
    }
    async invalidateTenantCache(tenantId, namespace) {
        const pattern = `cache:${namespace}:${tenantId}:*`;
        await this.invalidate(pattern);
    }
    async ping() {
        if (!this.client.isOpen) {
            throw new Error('Redis client is not open');
        }
        return await this.client.ping();
    }
    async blacklistToken(jti, ttlSeconds) {
        if (!this.client.isOpen)
            return;
        await this.client.setEx(`revoked:token:${jti}`, ttlSeconds, '1');
    }
    async isTokenBlacklisted(jti) {
        if (!this.client.isOpen)
            return false;
        const exists = await this.client.exists(`revoked:token:${jti}`);
        return exists === 1;
    }
    async getTelemetry() {
        if (!this.client.isOpen)
            return null;
        try {
            const hits = parseInt(await this.client.get('system:cache:hits') || '0', 10);
            const misses = parseInt(await this.client.get('system:cache:misses') || '0', 10);
            const total = hits + misses;
            const hitRatio = total > 0 ? ((hits / total) * 100).toFixed(2) + '%' : '0%';
            return { hits, misses, total, hitRatio };
        }
        catch (e) {
            return null;
        }
    }
}
export const redisCache = new RedisClient();
