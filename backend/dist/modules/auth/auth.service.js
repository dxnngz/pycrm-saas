import { prisma } from '../../core/prisma.js';
export class AuthService {
    async getUserByEmail(email) {
        return await prisma.user.findUnique({ where: { email } });
    }
    async getUserProfileById(id) {
        return await prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, email: true, role: true, created_at: true }
        });
    }
    async registerTenantWithUser(data) {
        return await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: data.companyName,
                }
            });
            const user = await tx.user.create({
                data: {
                    tenant_id: tenant.id,
                    name: data.name,
                    email: data.email,
                    password: data.passwordHash,
                    role: data.role
                }
            });
            return { user, tenant };
        });
    }
    async saveRefreshToken(userId, token, expiresAt) {
        return await prisma.refreshToken.create({
            data: {
                user_id: userId,
                token,
                expires_at: expiresAt
            }
        });
    }
    async findRefreshToken(token) {
        return await prisma.refreshToken.findUnique({
            where: { token }
        });
    }
    async deleteRefreshToken(token) {
        return await prisma.refreshToken.delete({
            where: { token }
        });
    }
    // Password reset functions
    async savePasswordResetToken(userId, token, expiresAt) {
        return await prisma.passwordReset.create({
            data: {
                user_id: userId,
                token,
                expires_at: expiresAt
            }
        });
    }
    async findPasswordResetToken(token) {
        return await prisma.passwordReset.findUnique({
            where: { token }
        });
    }
    async deletePasswordResetToken(token) {
        return await prisma.passwordReset.delete({
            where: { token }
        });
    }
    async updatePassword(userId, passwordHash) {
        return await prisma.user.update({
            where: { id: userId },
            data: { password: passwordHash }
        });
    }
}
export const authService = new AuthService();
