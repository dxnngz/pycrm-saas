import { query } from '../db.js';
export const getAllClients = async () => {
    const result = await query('SELECT * FROM clients ORDER BY created_at DESC');
    return result.rows;
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
