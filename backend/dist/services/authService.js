import { query } from '../db.js';
export const getUserByEmail = async (email) => {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
};
export const createUser = async (data) => {
    const { name, email, passwordHash, role } = data;
    const result = await query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role', [name, email, passwordHash, role || 'empleado']);
    return result.rows[0];
};
export const getUserProfileById = async (id) => {
    const result = await query('SELECT id, name, email, role FROM users WHERE id = $1', [id]);
    return result.rows[0];
};
export const saveRefreshToken = async (userId, token, expiresAt) => {
    await query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [userId, token, expiresAt]);
};
export const findRefreshToken = async (token) => {
    const result = await query('SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP', [token]);
    return result.rows[0];
};
export const deleteRefreshToken = async (token) => {
    await query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
};
export const savePasswordResetToken = async (userId, token, expiresAt) => {
    await query('INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)', [userId, token, expiresAt]);
};
export const findPasswordResetToken = async (token) => {
    const result = await query('SELECT * FROM password_resets WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP', [token]);
    return result.rows[0];
};
export const deletePasswordResetToken = async (token) => {
    await query('DELETE FROM password_resets WHERE token = $1', [token]);
};
export const updatePassword = async (userId, passwordHash) => {
    await query('UPDATE users SET password = $1 WHERE id = $2', [passwordHash, userId]);
};
