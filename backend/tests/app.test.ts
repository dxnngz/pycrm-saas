import { jest, describe, it, expect, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { prisma } from '../src/core/prisma.js';

import app from '../src/app.js';

describe('App Endpoints', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('GET /api/health', () => {
        it('should return 200 and healthy status', async () => {
            const res = await request(app).get('/api/health');
            expect(res.status).toBe(200);
            expect(['ok', 'degraded']).toContain(res.body.status);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should reject invalid credentials', async () => {
            // Mock prisma direct rejection or let it fall through to realistic DB response
            // For simple integration test, let it hit the test DB and fail correctly.
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'nonexistent@example.com', password: 'password123' });

            expect([401, 403]).toContain(res.status);
        });
    });
});
