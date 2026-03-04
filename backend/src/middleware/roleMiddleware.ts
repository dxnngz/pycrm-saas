import { Request, Response, NextFunction } from 'express';

export const roleMiddleware = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (!user || !user.role || !allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Acceso denegado: Permisos insuficientes' });
        }
        next();
    };
};
