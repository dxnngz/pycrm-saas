import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { AppError } from '../../utils/AppError.js';

export const validate = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validated = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            }) as Record<string, any>;

            // Replace req with validated data using defineProperty
            const props = ['body', 'query', 'params'] as const;
            props.forEach(prop => {
                const val = validated[prop];
                if (val !== undefined) {
                    Object.defineProperty(req, prop, {
                        value: val,
                        writable: true,
                        enumerable: true,
                        configurable: true
                    });
                }
            });

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
