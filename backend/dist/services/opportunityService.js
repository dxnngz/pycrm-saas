import { query } from '../db.js';
export const getAllOpportunities = async (page = 1, limit = 10, search = '') => {
    const offset = (page - 1) * limit;
    const searchQuery = search ? `%${search}%` : '%';
    const countResult = await query(`
        SELECT COUNT(*) 
        FROM opportunities o
        JOIN clients c ON o.client_id = c.id
        WHERE o.product ILIKE $1 OR c.name ILIKE $1 OR c.company ILIKE $1
    `, [searchQuery]);
    const total = parseInt(countResult.rows[0].count);
    const result = await query(`
        SELECT o.*, c.name as client_name, c.company as client_company 
        FROM opportunities o
        JOIN clients c ON o.client_id = c.id
        WHERE o.product ILIKE $1 OR c.name ILIKE $1 OR c.company ILIKE $1
        ORDER BY o.created_at DESC
        LIMIT $2 OFFSET $3
    `, [searchQuery, limit, offset]);
    return {
        data: result.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};
export const createOpportunity = async (data) => {
    const { client_id, product, amount, status, estimated_close_date } = data;
    const result = await query('INSERT INTO opportunities (client_id, product, amount, status, estimated_close_date) VALUES ($1, $2, $3, $4, $5) RETURNING *', [client_id, product, amount, status || 'pendiente', estimated_close_date]);
    return result.rows[0];
};
export const updateOpportunityStatusById = async (id, status) => {
    const result = await query('UPDATE opportunities SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    if (result.rowCount === 0)
        return null;
    return result.rows[0];
};
