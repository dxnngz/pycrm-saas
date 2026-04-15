import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().optional().default('3000'),
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

    // Email Config
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_SECURE: z.string().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().optional(),
    APP_NAME: z.string().optional(),

    // S3 Config
    S3_REGION: z.string().optional(),
    S3_ACCESS_KEY: z.string().optional(),
    S3_SECRET_KEY: z.string().optional(),
    S3_ENDPOINT: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    S3_PUBLIC_URL: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Configuración de entorno inválida:');
    _env.error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
}

// Sanitización automática de REDIS_URL para Upstash
const rawRedisUrl = _env.data.REDIS_URL;
let sanitizedRedisUrl = rawRedisUrl;

if (rawRedisUrl && rawRedisUrl.includes('direct-')) {
    // Si el usuario puso la URL 'direct-', la limpiamos para evitar ENOTFOUND en Render
    sanitizedRedisUrl = rawRedisUrl.replace('direct-', '');
    console.log('ℹ️ REDIS_URL detectada como "direct-". Aplicando limpieza automática para compatibilidad con Render.');
}

export const env = {
    ..._env.data,
    REDIS_URL: sanitizedRedisUrl
};
