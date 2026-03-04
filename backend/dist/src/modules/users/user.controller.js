import { userService } from './user.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await userService.getAllUsers();
    res.json(users);
});
export const updateUserRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
        const user = await userService.updateUserRole(parseInt(id), role);
        res.json(user);
    }
    catch (error) {
        if (error.code === 'P2025') {
            throw new AppError('Usuario no encontrado', 404);
        }
        throw error;
    }
});
export const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        await userService.deleteUser(parseInt(id));
        res.status(204).send();
    }
    catch (error) {
        if (error.code === 'P2025') {
            throw new AppError('Usuario no encontrado', 404);
        }
        throw error;
    }
});
