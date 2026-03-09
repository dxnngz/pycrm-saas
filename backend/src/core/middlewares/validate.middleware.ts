import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { AppError } from '../../utils/AppError.js';

export const validate = (schema: z.ZodObject<any, any>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validated = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });

            // Replace req with validated data
            req.body = (validated as any).body;
            req.query = (validated as any).query;
            req.params = (validated as any).params;

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const details = error.issues.map(issue => ({
                    path: issue.path.join('.'),
                    message: issue.message
                }));
                return next(new AppError('Error de validación', 400, details));
            }
            next(error);
        }
    };
};
