import { prisma } from '../../core/prisma.js';
import { hashPassword } from '../../auth.js';
import type { SystemRole } from '../../core/middlewares/rbac.middleware.js';

export class UserService {
    async getAllUsers() {
        return await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, created_at: true },
            orderBy: { created_at: 'desc' }
        });
    }

    async createUser(tenantId: number, data: { name: string; email: string; password: string; role: SystemRole }) {
        const passwordHash = await hashPassword(data.password);
        return await prisma.user.create({
            data: {
                tenant_id: tenantId,
                name: data.name,
                email: data.email,
                password: passwordHash,
                role: String(data.role || '').toLowerCase()
            },
            select: { id: true, name: true, email: true, role: true, created_at: true }
        });
    }

    async updateUserRole(id: number, role: string) {
        return await prisma.user.update({
            where: { id },
            data: { role: String(role || '').toLowerCase() },
            select: { id: true, name: true, email: true, role: true, created_at: true }
        });
    }

    async deleteUser(id: number) {
        return await prisma.user.delete({
            where: { id }
        });
    }
}

export const userService = new UserService();
