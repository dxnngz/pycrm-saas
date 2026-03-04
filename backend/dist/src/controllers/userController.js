import * as userService from '../services/userService.js';
export const getAllUsers = async (req, res, next) => {
    try {
        const users = await userService.getAllUsers();
        res.json(users);
    }
    catch (err) {
        next(err);
    }
};
export const updateUserRole = async (req, res, next) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
        const user = await userService.updateUserRole(parseInt(id), role);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(user);
    }
    catch (err) {
        next(err);
    }
};
export const deleteUser = async (req, res, next) => {
    const { id } = req.params;
    try {
        await userService.deleteUser(parseInt(id));
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
};
