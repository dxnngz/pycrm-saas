import { Request, Response } from 'express';
import { userService } from './user.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await userService.getAllUsers();
    res.json(users);
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    try {
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
