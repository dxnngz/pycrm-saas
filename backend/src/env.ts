import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().optional().default('3001'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DB_HOST: z.string().default('localhost'),
    DB_PORT: z.string().default('5432'),
    DB_USER: z.string().default('postgres'),
    DB_PASSWORD: z.any().optional().default(''),
    DB_NAME: z.string().default('pycrm'),
    DATABASE_URL: z.string().optional(),
    REDIS_URL: z.string().optional(),
    JWT_SECRET: z.string().min(1, 'Obligatorio'),
    JWT_REFRESH_SECRET: z.any().optional().default('default_refresh'),
    FRONTEND_URL: z.any().optional(),
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
