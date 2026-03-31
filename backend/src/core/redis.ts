import { createClient } from 'redis';
import { logger } from '../utils/logger.js';
import { redisCacheHits, redisCacheMisses } from './metrics.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisClient {
    private client;

    constructor() {
        this.client = createClient({ url: REDIS_URL });

        this.client.on('error', (err) => logger.error({ err }, 'Redis Client Error'));

        // No bloqueamos el hilo principal si Redis no está levantado, ni en tests
        if (process.env.NODE_ENV !== 'test') {
            this.client.connect().catch((e: any) => {
                logger.warn({ error: e.message }, '⚠️ No se pudo conectar a Redis. Pasando a fallback in-memory (bypass de caché).');
            });
        }
    }

    private isClientReady(): boolean {
        return this.client.isOpen && this.client.isReady;
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.isClientReady()) return null;
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) as T : null;
        } catch (error) {
            return null;
        }
    }

    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        if (!this.isClientReady()) return;
        try {
            const data = JSON.stringify(value);
            if (ttlSeconds) {
                await this.client.setEx(key, ttlSeconds, data);
            } else {
                await this.client.set(key, data);
            }
        } catch (error) {
            logger.error({ error, key }, 'Error seteando en Redis');
        }
    }

    async getOrSet<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
        if (!this.isClientReady()) {
            return await fetcher();
        }

        try {
            const cachedValue = await this.client.get(key);
            if (cachedValue) {
                this.client.incr('system:cache:hits').catch(() => { });
                const entityName = key.split(':')[1] || 'unknown';
                redisCacheHits.inc({ entity: entityName });
                return JSON.parse(cachedValue) as T;
            }

            const freshData = await fetcher();
            this.client.incr('system:cache:misses').catch(() => { });
            const entityName = key.split(':')[1] || 'unknown';
            redisCacheMisses.inc({ entity: entityName });
            await this.client.setEx(key, ttlSeconds, JSON.stringify(freshData));
            return freshData;
        } catch (error) {
            logger.error({ error, key }, 'Error en caché Redis');
            return await fetcher(); // Fallback a la base de datos si Redis falla
        }
    }

    async invalidate(pattern: string) {
        if (!this.isClientReady()) return;
        try {
            const keys: string[] = [];
            for await (const key of this.client.scanIterator({ MATCH: pattern, COUNT: 500 })) {
                keys.push(key);
            }
            if (keys.length > 0) {
                await this.client.unlink(keys);
                logger.info({ keysCount: keys.length, pattern }, '[Redis] Unlinked keys matching pattern');
            }
        } catch (error) {
            logger.error({ error, pattern }, 'Error invalidando caché Redis');
        }
    }

    async invalidateTenantCache(tenantId: number, namespace: string) {
        const pattern = `cache:${namespace}:${tenantId}:*`;
        await this.invalidate(pattern);
    }

    async ping(): Promise<string> {
        if (!this.isClientReady()) {
            throw new Error('Redis client is not ready');
        }

        // Safety timeout for ping
        return Promise.race([
            this.client.ping(),
            new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Redis ping timeout')), 1000))
        ]);
    }

    async blacklistToken(jti: string, ttlSeconds: number) {
        if (!this.isClientReady()) return;
        await this.client.setEx(`revoked:token:${jti}`, ttlSeconds, '1');
    }

    async isTokenBlacklisted(jti: string): Promise<boolean> {
        if (!this.isClientReady()) return false;
        const exists = await this.client.exists(`revoked:token:${jti}`);
        return exists === 1;
    }

    async getTelemetry() {
        if (!this.isClientReady()) return { status: 'disconnected', hits: 0, misses: 0, total: 0, hitRatio: '0%' };
        try {
            const hits = parseInt(await this.client.get('system:cache:hits') || '0', 10);
            const misses = parseInt(await this.client.get('system:cache:misses') || '0', 10);
            const total = hits + misses;
            const hitRatio = total > 0 ? ((hits / total) * 100).toFixed(2) + '%' : '0%';

            return { status: 'healthy', hits, misses, total, hitRatio };
        } catch (e) {
            return { status: 'error', hits: 0, misses: 0, total: 0, hitRatio: '0%' };
        }
    }
}

export const redisCache = new RedisClient();
