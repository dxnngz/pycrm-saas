import { query } from '../db.js';
export const getAllUsers = async () => {
    const result = await query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    return result.rows;
};
export const updateUserRole = async (id, role) => {
    const result = await query('UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role, created_at', [role, id]);
    return result.rows[0] || null;
};
export const deleteUser = async (id) => {
    await query('DELETE FROM users WHERE id = $1', [id]);
};
