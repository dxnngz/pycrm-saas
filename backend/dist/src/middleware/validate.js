import { ZodError } from 'zod';
/**
 * Middleware to validate request data against a Zod schema.
 * Rejects requests with 400 Bad Request if validation fails.
 */
export const validate = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
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
