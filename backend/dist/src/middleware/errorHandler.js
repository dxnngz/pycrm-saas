import { ZodError } from 'zod';
export const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${err.name}: ${err.message}`);
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    // Si ocurre un error de validación de Zod no atrapado en middlewares locales
    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            message: 'Error de validación de datos',
            errors: err.issues.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message
            }))
        });
    }
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
    if (statusCode === 500) {
        console.error(`[Stack Trace] ${err.stack}`);
    }
};
