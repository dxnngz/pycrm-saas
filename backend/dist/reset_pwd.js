import { hashPassword } from './auth.js';
import { query } from './db.js';
async function reset() {
    const hash = await hashPassword('admin123');
    await query("UPDATE users SET password = $1 WHERE email = 'admin@pycrm.com'", [hash]);
    console.log('Password reset successful');
    process.exit(0);
}
reset();
