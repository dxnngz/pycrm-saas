import { query } from '../db.js';
export const getContactsByClientId = async (clientId) => {
    const result = await query(`SELECT c.*
         FROM contacts c
         WHERE c.client_id = $1
         ORDER BY c.contact_date DESC`, [clientId]);
    return result.rows;
};
export const createContact = async (data) => {
    const { client_id, type, description, contact_date } = data;
    const result = await query(`INSERT INTO contacts (client_id, type, description, contact_date)
         VALUES ($1, $2, $3, COALESCE($4, CURRENT_TIMESTAMP))
         RETURNING *`, [client_id, type, description, contact_date || null]);
    return result.rows[0];
};
