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

            // Replace req with validated data using defineProperty to bypass getter-only TypeErrors in production Node.js
            Object.defineProperty(req, 'body', { value: (validated as any).body, writable: true, enumerable: true, configurable: true });
            Object.defineProperty(req, 'query', { value: (validated as any).query, writable: true, enumerable: true, configurable: true });
            Object.defineProperty(req, 'params', { value: (validated as any).params, writable: true, enumerable: true, configurable: true });

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
