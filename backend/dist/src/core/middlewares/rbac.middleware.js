// Definición de Roles Estáticos del Sistema SaaS
export var SystemRole;
(function (SystemRole) {
    SystemRole["ADMIN"] = "admin";
    SystemRole["MANAGER"] = "manager";
    SystemRole["USER"] = "user";
    SystemRole["SALES"] = "sales";
})(SystemRole || (SystemRole = {}));
// Definición Granular de Permisos
export var Permission;
(function (Permission) {
    // Opportunities
    Permission["READ_OPPORTUNITY"] = "read:opportunity";
    Permission["WRITE_OPPORTUNITY"] = "write:opportunity";
    Permission["DELETE_OPPORTUNITY"] = "delete:opportunity";
    // Clients
    Permission["READ_CLIENT"] = "read:client";
    Permission["WRITE_CLIENT"] = "write:client";
    Permission["DELETE_CLIENT"] = "delete:client";
    // Tasks
    Permission["READ_TASK"] = "read:task";
    Permission["WRITE_TASK"] = "write:task";
    Permission["DELETE_TASK"] = "delete:task";
    // Users
    Permission["READ_USER"] = "read:user";
    Permission["WRITE_USER"] = "write:user";
    Permission["DELETE_USER"] = "delete:user";
})(Permission || (Permission = {}));
// Mapa de Rol a Permisos
export const RolePermissions = {
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
export const requirePermission = (requiredPermission) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user || !user.role) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }
        const userRole = user.role.toLowerCase();
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
