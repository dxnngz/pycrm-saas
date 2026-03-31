import { z } from 'zod';

export const createTaskSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'El título es requerido'),
        description: z.string().optional(),
        due_date: z.string().optional().transform(v => (v ? new Date(v) : undefined)),
        deadline: z.string().optional().transform(v => (v ? new Date(v) : undefined)),
        priority: z.string().optional().default('Media'),
        status: z.enum(['pending', 'completed']).default('pending'),
    })
});

export const updateTaskSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
    }),
    body: z.object({
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        due_date: z.string().optional().transform(v => (v ? new Date(v) : undefined)),
        deadline: z.string().optional().transform(v => (v ? new Date(v) : undefined)),
        priority: z.string().optional(),
        status: z.enum(['pending', 'completed']).optional(),
    })
});

export const getTasksSchema = z.object({
    query: z.object({
        limit: z.string().optional().transform(v => (v ? parseInt(v, 10) : 10)),
        search: z.string().optional().default(''),
        cursor: z.string().optional().transform(v => (v ? parseInt(v, 10) : undefined)),
    })
});

export const taskIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
    })
});
