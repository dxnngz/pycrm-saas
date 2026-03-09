import { z } from 'zod';

export const createClientSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
        company: z.string().optional(),
        email: z.string().email('Email inválido').optional().or(z.literal('')),
        phone: z.string().optional(),
        status: z.enum(['activo', 'inactivo', 'lead']).default('activo'),
    })
});

export const updateClientSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
    }),
    body: z.object({
        name: z.string().min(2).optional(),
        company: z.string().optional(),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string().optional(),
        status: z.enum(['activo', 'inactivo', 'lead']).optional(),
    })
});

export const getClientsSchema = z.object({
    query: z.object({
        limit: z.string().optional().transform(v => (v ? parseInt(v, 10) : 10)),
        search: z.string().optional().default(''),
        cursor: z.string().optional().transform(v => (v ? parseInt(v, 10) : undefined)),
    })
});

export const clientIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
    })
});
