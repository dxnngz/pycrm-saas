import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Check if the client already sent a request ID (e.g., from an API gateway)
    const reqId = req.headers['x-request-id'] || uuidv4();

    // Attach to request object for easy access
    (req as any).id = reqId;

    // Also attach to response headers so the client knows their tracking ID
    res.setHeader('X-Request-Id', reqId as string);

    next();
};
