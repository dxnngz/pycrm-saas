import { ZodError } from 'zod';
/**
 * Middleware to validate request data against a Zod schema.
 * Rejects requests with 400 Bad Request if validation fails.
 */
export const validate = (schema) => async (req, res, next) => {
    try {
        const parsed = await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        const validated = parsed;
        if (validated.body)
            req.body = validated.body;
        if (validated.query)
            Object.assign(req.query, validated.query);
        if (validated.params)
            Object.assign(req.params, validated.params);
        next();
    }
    catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                message: 'Error de validación de datos',
                errors: error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }
        next(error);
    }
};
