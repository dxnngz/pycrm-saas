import { z } from 'zod';
import { SystemRole } from '../../core/middlewares/rbac.middleware.js';

export const createUserSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2).max(100),
        email: z.string().trim().email().max(100),
        password: z.string().min(8).max(72),
        role: z.nativeEnum(SystemRole).optional().default(SystemRole.EMPLEADO),
    }),
});

export const updateUserRoleSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        role: z.nativeEnum(SystemRole),
    }),
});

