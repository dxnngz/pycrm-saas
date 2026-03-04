import { z } from 'zod';
export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Email inválido'),
        password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    }),
});
export const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1, 'Refresh token es requerido'),
    }),
});
export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email('Email inválido'),
    }),
});
export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Token es requerido'),
        newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    }),
});
export const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
        email: z.string().email('Email inválido'),
        password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
        role: z.enum(['admin', 'empleado']).optional(),
    }),
});
export const clientSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
        company: z.string().min(2, 'La empresa debe tener al menos 2 caracteres').optional().or(z.literal('')),
        email: z.string().email('Email inválido'),
        phone: z.string().optional().or(z.literal('')),
        status: z.enum(['activo', 'lead', 'inactivo']).optional()
    })
});
export const opportunitySchema = z.object({
    body: z.object({
        client_id: z.number().int(),
        product: z.string().min(2),
        amount: z.number().positive(),
        status: z.enum(['pendiente', 'ganado', 'perdido']).optional(),
        estimated_close_date: z.string().optional().or(z.literal('')),
    }),
});
export const statusUpdateSchema = z.object({
    body: z.object({
        status: z.enum(['pendiente', 'ganado', 'perdido']),
    }),
});
export const taskSchema = z.object({
    body: z.object({
        title: z.string().min(3),
        deadline: z.string().optional().or(z.literal('')),
        priority: z.enum(['Alta', 'Media', 'Baja']).optional(),
        client_id: z.number().int().optional().nullable(),
    }),
});
export const contactSchema = z.object({
    body: z.object({
        client_id: z.number().int(),
        type: z.enum(['call', 'email', 'meeting', 'note']),
        description: z.string().min(1),
        contact_date: z.string().optional(),
    }),
});
export const roleUpdateSchema = z.object({
    body: z.object({
        role: z.enum(['admin', 'empleado']),
    }),
});
