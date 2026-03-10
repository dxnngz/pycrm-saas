import { useEffect, useRef } from 'react';
import { captureRUMMetrics } from '../utils/metrics';

export const useFPSMonitor = (componentName: string, threshold: number = 30) => {
    const requestRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const frameCountRef = useRef<number>(0);

    useEffect(() => {
        // Initialize last time safely inside the effect
        lastTimeRef.current = performance.now();

        const loop = (time: number) => {
            frameCountRef.current++;
            const delta = time - lastTimeRef.current;

            // Calculate FPS every second
            if (delta >= 1000) {
                const currentFps = (frameCountRef.current * 1000) / delta;

                if (currentFps < threshold) {
                    console.warn(`[RUM ALERT] ⚠️ Low FPS detected in ${componentName}: ${Math.round(currentFps)} FPS`);
                    // Export this to our mock telemetry
                    captureRUMMetrics({
                        latencyMs: delta,
                        endpoint: `ui_jank_${(componentName || 'unknown').toLowerCase()}`,
                        method: 'UI_EVENT',
                        status: Math.round(currentFps), // Abusing status field to send FPS for now
                        requestID: `fps-${Math.random().toString(36).substring(7)}`,
                        timestamp: new Date().toISOString()
                    });
                }

                frameCountRef.current = 0;
                lastTimeRef.current = time;
            }
            requestRef.current = requestAnimationFrame(loop);
        };

        requestRef.current = requestAnimationFrame(loop);

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [componentName, threshold]);
};
