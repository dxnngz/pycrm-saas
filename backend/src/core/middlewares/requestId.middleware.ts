import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { contextStore } from '../context.js';

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const reqId = (req.headers['x-request-id'] || uuidv4()) as string;

    req.id = reqId;
    res.setHeader('X-Request-Id', reqId);

    // Initialize the context store for the entire request lifecycle
    contextStore.run({ requestId: reqId }, () => {
        next();
    });
};
