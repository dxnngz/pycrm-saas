import { AppError } from '../../utils/AppError.js';
export const csrfProtection = (req, res, next) => {
    // Ignorar métodos seguros que no alteran estado
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    // Patrón Double Submit Cookie
    const csrfCookie = req.cookies.csrfToken;
    const csrfHeader = req.headers['x-csrf-token'];
    if (!csrfCookie || !csrfHeader) {
        throw new AppError('Firma CSRF ausente. Seguridad activada.', 403);
    }
    if (csrfCookie !== csrfHeader) {
        throw new AppError('Mismatch en firma CSRF. Petición bloqueada.', 403);
    }
    next();
};
