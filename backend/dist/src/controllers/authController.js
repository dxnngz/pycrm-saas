import * as authService from '../services/authService.js';
import { comparePassword, hashPassword, generateToken } from '../auth.js';
export const login = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const user = await authService.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        const token = generateToken(user.id, user.role);
        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    }
    catch (err) {
        next(err);
    }
};
export const register = async (req, res, next) => {
    const { name, email, password, role } = req.body;
    try {
        const passwordHash = await hashPassword(password);
        const user = await authService.createUser({ name, email, passwordHash, role });
        res.status(201).json(user);
    }
    catch (err) {
        next(err);
    }
};
export const getProfile = async (req, res, next) => {
    const userId = req.user.userId;
    try {
        const user = await authService.getUserProfileById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(user);
    }
    catch (err) {
        next(err);
    }
};
