import { Request, Response, NextFunction } from 'express';

// Definición de Roles Estáticos del Sistema SaaS
export enum SystemRole {
    ADMIN = 'admin',
    MANAGER = 'manager',
    USER = 'user',
    SALES = 'sales'
}

// Definición Granular de Permisos
export enum Permission {
    // Opportunities
    READ_OPPORTUNITY = 'read:opportunity',
    WRITE_OPPORTUNITY = 'write:opportunity',
    DELETE_OPPORTUNITY = 'delete:opportunity',

    // Clients
    READ_CLIENT = 'read:client',
    WRITE_CLIENT = 'write:client',
    DELETE_CLIENT = 'delete:client',

    // Tasks
    READ_TASK = 'read:task',
    WRITE_TASK = 'write:task',
    DELETE_TASK = 'delete:task',

    // Users
    READ_USER = 'read:user',
    WRITE_USER = 'write:user',
    DELETE_USER = 'delete:user',
}

// Mapa de Rol a Permisos
export const RolePermissions: Record<string, Permission[]> = {
    [SystemRole.ADMIN]: Object.values(Permission), // Admin tiene acceso total
    [SystemRole.MANAGER]: [
        Permission.READ_OPPORTUNITY, Permission.WRITE_OPPORTUNITY, Permission.DELETE_OPPORTUNITY,
        Permission.READ_CLIENT, Permission.WRITE_CLIENT, Permission.DELETE_CLIENT,
        Permission.READ_TASK, Permission.WRITE_TASK, Permission.DELETE_TASK,
        Permission.READ_USER, Permission.WRITE_USER
    ],
    [SystemRole.SALES]: [
        Permission.READ_OPPORTUNITY, Permission.WRITE_OPPORTUNITY,
        Permission.READ_CLIENT, Permission.WRITE_CLIENT,
        Permission.READ_TASK, Permission.WRITE_TASK
    ],
    [SystemRole.USER]: [
        Permission.READ_OPPORTUNITY,
        Permission.READ_CLIENT,
        Permission.READ_TASK, Permission.WRITE_TASK
    ]
};

// Middleware de Autorización por Permiso
export const requirePermission = (requiredPermission: Permission) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;

        if (!user || !user.role) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        const userRole = user.role.toLowerCase() as SystemRole;
        const permissions = RolePermissions[userRole] || [];

        if (permissions.includes(requiredPermission)) {
            return next();
        }

        return res.status(403).json({
            status: 'error',
            message: `Forbidden: Se requiere permiso '${requiredPermission}'`
        });
    };
};

// Middleware de Autorización por Rol
export const requireRole = (allowedRoles: SystemRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;

        if (!user || !user.role) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        if (allowedRoles.includes(user.role.toLowerCase() as SystemRole)) {
            return next();
        }

        return res.status(403).json({
            status: 'error',
            message: 'Forbidden: No tienes el rol necesario para realizar esta acción'
        });
    };
};
