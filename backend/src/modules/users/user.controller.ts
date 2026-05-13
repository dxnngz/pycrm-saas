import { Request, Response } from 'express';
import { userService } from './user.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { SystemRole } from '../../core/middlewares/rbac.middleware.js';

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await userService.getAllUsers();
    res.json(users);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const requesterRole = String(req.user?.role || '').toLowerCase();

    const { name, email, password, role } = req.body as { name: string; email: string; password: string; role: SystemRole };

    if (requesterRole !== SystemRole.ADMIN && role === SystemRole.ADMIN) {
        throw new AppError('Solo un administrador puede crear otros administradores.', 403);
    }

    try {
        const user = await userService.createUser(tenantId, { name, email, password, role });
        res.status(201).json(user);
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new AppError('Ya existe un usuario con ese correo.', 409);
        }
        throw error;
    }
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    try {
        const requesterRole = String(req.user?.role || '').toLowerCase();
        const targetRole = String(role || '').toLowerCase();
        if (requesterRole !== SystemRole.ADMIN && targetRole === SystemRole.ADMIN) {
            throw new AppError('Solo un administrador puede asignar rol admin.', 403);
        }

        const user = await userService.updateUserRole(parseInt(id as string), role);
        res.json(user);
    } catch (error: any) {
        if (error.code === 'P2025') {
            throw new AppError('Usuario no encontrado', 404);
        }
        throw error;
    }
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await userService.deleteUser(parseInt(id as string));
        res.status(204).send();
    } catch (error: any) {
        if (error.code === 'P2025') {
            throw new AppError('Usuario no encontrado', 404);
        }
        throw error;
    }
});
