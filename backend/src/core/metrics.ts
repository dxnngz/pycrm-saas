import client from 'prom-client';

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
    app: 'saas-crm-api'
});

// Enable the collection of default metrics (memory, CPU, Event Loop Lag, etc.)
client.collectDefaultMetrics({ register });

// ----------------------------------------------------------------------------
// Custom Application Metrics
// ----------------------------------------------------------------------------

// 1. HTTP Request Latency & Count per Endpoint / Tenant
export const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'status_code', 'tenant_id'],
    // buckets for response time from 0.1ms to 500ms
    buckets: [0.1, 5, 15, 50, 100, 200, 300, 400, 500],
    registers: [register],
});

// 2. Database Connections (If possible to track manually)
export const dbActiveConnections = new client.Gauge({
    name: 'db_active_connections',
    help: 'Number of active database connections',
    registers: [register]
});

// 3. Redis Cache Hit/Miss Ratio
export const redisCacheHits = new client.Counter({
    name: 'redis_cache_hits_total',
    help: 'Total number of Redis cache hits',
    labelNames: ['entity'],
    registers: [register]
});

export const redisCacheMisses = new client.Counter({
    name: 'redis_cache_misses_total',
    help: 'Total number of Redis cache misses',
    labelNames: ['entity'],
    registers: [register]
});

// Helper to expose the registry explicitly
export const getMetrics = async () => {
    return await register.metrics();
};

export const getContentType = () => {
    return register.contentType;
};
