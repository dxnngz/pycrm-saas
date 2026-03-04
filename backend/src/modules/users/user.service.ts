import { prisma } from '../../core/prisma.js';

export class UserService {
    async getAllUsers() {
        return await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, created_at: true },
            orderBy: { created_at: 'desc' }
        });
    }

    async updateUserRole(id: number, role: string) {
        return await prisma.user.update({
            where: { id },
            data: { role },
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
