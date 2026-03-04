export const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }
    else {
        // En producción, esconder errores de programación/internos
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        }
        else {
            console.error('CRITICAL_ERROR 💥', {
                requestId: req.id,
                message: err.message,
                stack: err.stack,
                tenant: req.user?.tenant_id
            });
            res.status(500).json({
                status: 'error',
                message: 'Error interno del sistema. El incidente ha sido reportado.'
            });
        }
    }
};
