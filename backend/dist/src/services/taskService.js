import { query } from '../db.js';
export const getTasksByUserId = async (userId) => {
    const result = await query(`SELECT t.*, c.name as client_name 
         FROM tasks t 
         LEFT JOIN clients c ON t.client_id = c.id 
         WHERE t.user_id = $1 
         ORDER BY t.deadline ASC`, [userId]);
    return result.rows;
};
export const createTask = async (data) => {
    const { userId, title, deadline, priority, client_id } = data;
    const result = await query('INSERT INTO tasks (user_id, client_id, title, deadline, priority) VALUES ($1, $2, $3, $4, $5) RETURNING *', [userId, client_id, title, deadline, priority || 'Media']);
    return result.rows[0];
};
export const toggleTaskCompletionStatus = async (id, userId) => {
    const result = await query('UPDATE tasks SET completed = NOT completed WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
    if (result.rows.length === 0)
        return null;
    return result.rows[0];
};
export const deleteTaskById = async (id, userId) => {
    const result = await query('DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
    return result.rows.length > 0;
};
