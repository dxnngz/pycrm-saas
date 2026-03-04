import { prisma } from './src/core/prisma.js';
import { dbActiveConnections } from './src/core/metrics.js';

setInterval(() => {
    // Prisma 5+ metrics API (if preview feature 'metrics' is enabled)
    // For now we just mock or skip, since enabling Prisma metrics requires a schema change
}, 10000);
