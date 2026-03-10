import { prisma } from '../../core/prisma.js';
import { hashPassword, comparePassword } from '../../auth.js';
import { Prisma } from '@prisma/client';

export class AuthService {

    async getUserByEmail(email: string) {
        return await prisma.user.findUnique({ where: { email } });
    }

    async getUserProfileById(id: number) {
        return await prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, email: true, role: true, tenant_id: true, created_at: true }
        });
    }

    async registerTenantWithUser(data: { name: string, email: string, passwordHash: string, role: string, companyName: string }) {
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

    async saveRefreshToken(userId: number, token: string, expiresAt: Date) {
        return await prisma.refreshToken.create({
            data: {
                user_id: userId,
                token,
                expires_at: expiresAt
            }
        });
    }

    async revokeAllUserTokens(userId: number) {
        return await prisma.refreshToken.deleteMany({
            where: { user_id: userId }
        });
    }

    async findRefreshToken(token: string) {
        return await prisma.refreshToken.findUnique({
            where: { token }
        });
    }

    async deleteRefreshToken(token: string) {
        return await prisma.refreshToken.delete({
            where: { token }
        });
    }

    // Password reset functions
    async savePasswordResetToken(userId: number, token: string, expiresAt: Date) {
        return await prisma.passwordReset.create({
            data: {
                user_id: userId,
                token,
                expires_at: expiresAt
            }
        });
    }

    async findPasswordResetToken(token: string) {
        return await prisma.passwordReset.findUnique({
            where: { token }
        });
    }

    async deletePasswordResetToken(token: string) {
        return await prisma.passwordReset.delete({
            where: { token }
        });
    }

    async updatePassword(userId: number, passwordHash: string) {
        return await prisma.user.update({
            where: { id: userId },
            data: { password: passwordHash }
        });
    }
}

export const authService = new AuthService();
