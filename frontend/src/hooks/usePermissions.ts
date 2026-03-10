import { useAuth } from '../context/AuthContext';

export const FrontendRole = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    SALES: 'sales',
    USER: 'user'
} as const;

export type FrontendRoleType = typeof FrontendRole[keyof typeof FrontendRole];

export const usePermissions = () => {
    const { user } = useAuth();

    const role = ((user?.role ?? '').toLowerCase() as FrontendRoleType) || FrontendRole.USER;

    const isAdmin = role === FrontendRole.ADMIN;
    const isManagerOrAbove = isAdmin || role === FrontendRole.MANAGER;
    const isSalesOrAbove = isManagerOrAbove || role === FrontendRole.SALES;

    return {
        // Entidades (Lectura implícita para la mayoría basadas en tenant)
        canCreateClient: isManagerOrAbove || isSalesOrAbove,
        canDeleteClient: isManagerOrAbove,

        canCreateOpportunity: isManagerOrAbove || isSalesOrAbove,
        canDeleteOpportunity: isManagerOrAbove,

        canCreateTask: true, // Cualquier usuario puede crear una tarea (asignada a sí mismo)
        canDeleteTask: isManagerOrAbove,

        canManageUsers: isManagerOrAbove, // Admin y Manager pueden agregar usuarios al tenant

        role
    };
};
