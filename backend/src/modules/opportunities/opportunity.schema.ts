import { z } from 'zod';

export const createOpportunitySchema = z.object({
    body: z.object({
        client_id: z.number().int().positive('ID de cliente inválido'),
        product: z.string().min(1, 'El producto es requerido'),
        amount: z.number().positive('El monto debe ser positivo'),
        status: z.enum(['pendiente', 'ganado', 'perdido']).default('pendiente'),
        notes: z.string().optional(),
        source: z.string().trim().min(1).max(50).optional(),
        probability: z.number().int().min(0).max(100).optional(),
        estimated_close_date: z.string().optional(),
        next_action_at: z.string().optional(),
    })
});

export const updateOpportunityStatusSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
    }),
    body: z.object({
        status: z.enum(['pendiente', 'ganado', 'perdido']),
        lost_reason: z.string().trim().min(1).max(50).optional(),
        lost_reason_detail: z.string().trim().max(1000).optional(),
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

export const getOpportunitySummarySchema = z.object({
    query: z.object({
        search: z.string().optional().default(''),
    })
});

export const opportunityIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
    })
});

export const updateOpportunitySchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
    }),
    body: z.object({
        client_id: z.number().int().positive().optional(),
        product: z.string().min(1).optional(),
        amount: z.number().positive().optional(),
        notes: z.string().optional(),
        source: z.string().trim().min(1).max(50).optional(),
        probability: z.number().int().min(0).max(100).optional(),
        estimated_close_date: z.string().optional(),
        next_action_at: z.string().optional(),
        assigned_to: z.number().int().positive().optional(),
        version: z.number().optional()
    })
});
