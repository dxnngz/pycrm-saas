import { jest, describe, it, expect, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
describe('App Endpoints', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('GET /api/health', () => {
        it('should return 200 and healthy status', async () => {
            const res = await request(app).get('/api/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
        });
    });
    describe('POST /api/auth/login', () => {
        it('should return 401 for invalid credentials', async () => {
            // Mock prisma direct rejection or let it fall through to realistic DB response
            // For simple integration test, let it hit the test DB and fail correctly.
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'nonexistent@example.com', password: 'password123' });
            expect(res.status).toBe(401);
        });
    });
});
