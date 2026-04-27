import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    const isProduction = process.env.NODE_ENV?.toLowerCase() === 'production' || process.env.NODE_ENV === 'prod';

    if (!isProduction) {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
            details: err.details
        });
    } else {
        // En producción, esconder errores de programación/internos
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
                details: err.details
            });
        } else {
            logger.error({
                msg: 'CRITICAL_ERROR 💥',
                requestId: req.id,
                error: err.message,
                stack: err.stack,
                tenant: req.user?.tenantId
            });

            res.status(500).json({
                status: 'error',
                message: 'Error interno del sistema. El incidente ha sido reportado.'
            });
        }
    }
};
