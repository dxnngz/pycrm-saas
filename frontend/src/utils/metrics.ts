export interface RUMMetrics {
    latencyMs: number;
    endpoint: string;
    method: string;
    jsHeapSizeMB?: number;
    requestID: string;
    status: number;
    timestamp: string;
}

export const captureRUMMetrics = (metric: RUMMetrics) => {
    // 1. Log to console for dev feedback as requested
    if (metric.latencyMs > 1500) {
        console.warn(`[RUM ALERT] 🐌 Slow Request: ${metric.method} ${metric.endpoint} took ${Math.round(metric.latencyMs)}ms (Ref: ${metric.requestID})`);
    } else {
        console.debug(`[RUM] ⚡ ${metric.method} ${metric.endpoint} - ${Math.round(metric.latencyMs)}ms`);
    }

    if (metric.jsHeapSizeMB) {
        if (metric.jsHeapSizeMB > 250) {
            console.warn(`[RUM ALERT] ⚠️ High Memory Usage: ${metric.jsHeapSizeMB.toFixed(2)} MB`);
        }
    }

    // 2. Mock Export to Datadog/Sentry/Grafana (To be replaced with real SDK later)
    // fetch('https://metrics.tu-empresa.com/v1/rum', { method: 'POST', body: JSON.stringify(metric) });
};

export const getMemoryUsage = (): number | undefined => {
    // @ts-expect-error - performance.memory is Chrome specific but very useful for MVP internal RUM
    if (window.performance && performance.memory) {
        // @ts-expect-error - performance.memory is Chrome specific
        return performance.memory.usedJSHeapSize / (1024 * 1024);
    }
    return undefined;
};
