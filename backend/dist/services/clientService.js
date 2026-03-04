import { query } from '../db.js';
export const getAllClients = async (page = 1, limit = 10, search = '') => {
    const offset = (page - 1) * limit;
    const searchQuery = search ? `%${search}%` : '%';
    const countResult = await query('SELECT COUNT(*) FROM clients WHERE name ILIKE $1 OR company ILIKE $1 OR email ILIKE $1', [searchQuery]);
    const total = parseInt(countResult.rows[0].count);
    const result = await query('SELECT * FROM clients WHERE name ILIKE $1 OR company ILIKE $1 OR email ILIKE $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [searchQuery, limit, offset]);
    return {
        data: result.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};
export const createClient = async (data) => {
    const { name, company, email, phone } = data;
    const result = await query('INSERT INTO clients (name, company, email, phone) VALUES ($1, $2, $3, $4) RETURNING *', [name, company, email, phone]);
    return result.rows[0];
};
export const updateClientById = async (id, data) => {
    const { name, company, email, phone } = data;
    const result = await query('UPDATE clients SET name = $1, company = $2, email = $3, phone = $4 WHERE id = $5 RETURNING *', [name, company, email, phone, id]);
    if (result.rowCount === 0)
        return null;
    return result.rows[0];
};
export const deleteClientById = async (id) => {
    const result = await query('DELETE FROM clients WHERE id = $1', [id]);
    return result.rowCount !== 0; // Return true if deleted
};
export const getClientOpportunitiesById = async (id) => {
    const result = await query('SELECT * FROM opportunities WHERE client_id = $1', [id]);
    return result.rows;
};
