import { jest, describe, it, expect, afterEach } from '@jest/globals';
import request from 'supertest';
// Use unstable_mockModule for ESM native mocking in Jest
jest.unstable_mockModule('../src/db.js', () => ({
    query: jest.fn(),
}));
const { query } = await import('../src/db.js');
const { default: app } = await import('../src/index.js');
describe('App Endpoints', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('GET /api/health', () => {
        it('should return 200 and healthy status', async () => {
            const res = await request(app).get('/api/health');
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ status: 'ok', message: 'PyCRM API is running' });
        });
    });
    describe('POST /api/auth/login', () => {
        it('should return 401 for invalid credentials', async () => {
            query.mockResolvedValueOnce({ rows: [] }); // User not found
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'password123' });
            expect(res.status).toBe(401);
        });
    });
});
