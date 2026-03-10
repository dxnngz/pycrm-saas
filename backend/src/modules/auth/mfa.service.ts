import { generateSecret, generateURI, verify } from 'otplib';
import * as QRCode from 'qrcode';
import crypto from 'crypto';
import { prisma } from '../../core/prisma.js';

export class MFAService {
    /**
     * Generates a new MFA secret and a recovery codes for a user.
     */
    async initiateMFA(userId: number, userEmail: string) {
        const secret = generateSecret();
        const otpauth = generateURI({
            secret,
            issuer: 'PyCRM',
            label: userEmail
        });
        const qrCodeDataURL = await QRCode.toDataURL(otpauth);

        return {
            secret,
            qrCodeDataURL
        };
    }

    /**
     * Verifies the first MFA code and enables MFA for the user.
     */
    async enableMFA(userId: number, secret: string, token: string) {
        const isValid = await verify({ token, secret });
        if (!isValid) return false;

        // Generate 10 recovery codes
        const recoveryCodes = Array.from({ length: 10 }, () =>
            crypto.randomBytes(4).toString('hex').toUpperCase()
        );

        await prisma.user.update({
            where: { id: userId },
            data: {
                mfa_enabled: true,
                mfa_secret: secret,
                mfa_recovery_codes: recoveryCodes
            } as any
        });

        return recoveryCodes;
    }

    /**
     * Verifies an MFA token for an already enabled user.
     */
    async verifyMFAToken(userId: number, token: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                mfa_secret: true,
                mfa_enabled: true,
                mfa_recovery_codes: true,
                id: true,
                tenant_id: true,
                name: true,
                email: true
            } as any
        });

        if (!user || !(user as any).mfa_enabled || !(user as any).mfa_secret) return false;

        // Try TOTP
        const isValid = await verify({ token, secret: (user as any).mfa_secret });
        if (isValid) return true;

        // Try Recovery Codes
        if ((user as any).mfa_recovery_codes.includes(token.toUpperCase())) {
            // Remove the used recovery code
            await prisma.user.update({
                where: { id: userId },
                data: {
                    mfa_recovery_codes: (user as any).mfa_recovery_codes.filter((c: string) => c !== token.toUpperCase())
                } as any
            });
            return true;
        }

        return false;
    }

    /**
     * Disables MFA for a user.
     */
    async disableMFA(userId: number) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                mfa_enabled: false,
                mfa_secret: null,
                mfa_recovery_codes: []
            } as any
        });
    }
}

export const mfaService = new MFAService();
