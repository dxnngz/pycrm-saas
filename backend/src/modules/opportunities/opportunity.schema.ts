import { z } from 'zod';

export const createOpportunitySchema = z.object({
    body: z.object({
        client_id: z.number().int().positive('ID de cliente inválido'),
        product: z.string().min(1, 'El producto es requerido'),
        amount: z.number().positive('El monto debe ser positivo'),
        status: z.enum(['pendiente', 'ganado', 'perdido']).default('pendiente'),
        notes: z.string().optional(),
    })
});

export const updateOpportunityStatusSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
    }),
    body: z.object({
        status: z.enum(['pendiente', 'ganado', 'perdido']),
        version: z.number().optional()
    })
});

export const getOpportunitiesSchema = z.object({
    query: z.object({
        limit: z.string().optional().transform(v => (v ? parseInt(v, 10) : 10)),
        search: z.string().optional().default(''),
        cursor: z.string().optional().transform(v => (v ? parseInt(v, 10) : undefined)),
    })
});

export const opportunityIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
    })
});
