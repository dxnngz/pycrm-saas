export const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user || !user.role || !allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Acceso denegado: Permisos insuficientes' });
        }
        next();
    };
};
