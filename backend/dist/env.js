import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();
const envSchema = z.object({
    PORT: z.string().optional().default('3001'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DB_HOST: z.string().default('localhost'),
    DB_PORT: z.string().default('5432'),
    DB_USER: z.string().default('postgres'),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string().default('pycrm'),
    JWT_SECRET: z.string().min(10, 'El JWT_SECRET debe tener al menos 10 caracteres'),
    JWT_REFRESH_SECRET: z.string().min(10, 'El JWT_REFRESH_SECRET debe tener al menos 10 caracteres'),
    FRONTEND_URL: z.string().url().optional(),
    ALLOW_OPEN_REGISTRATION: z.string().optional().default('true'),
});
const _env = envSchema.safeParse(process.env);
if (!_env.success) {
    console.error('❌ Configuración de entorno inválida:');
    _env.error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
}
export const env = _env.data;
