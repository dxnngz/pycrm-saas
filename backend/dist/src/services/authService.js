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
