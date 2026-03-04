import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'pycrm',
});
// Test connection on startup
pool.connect((err, client, release) => {
    if (err) {
        return console.error('[Database] Error acquiring client', err.stack);
    }
    console.log('[Database] Connected successfully');
    release();
});
pool.on('error', (err) => {
    console.error('[Database] Unexpected error on idle client', err);
});
export const query = (text, params) => pool.query(text, params);
export default pool;
