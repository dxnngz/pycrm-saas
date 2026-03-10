const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting surgical migration cleanup and recovery (JS)...');

    const migrationsToReset = [
        '20260303221359_multitenant_core', // Let's try to be safe and only reset the ones that failed
        '20260309190148_enterprise_features',
        '20260310000934_auth_mfa_update',
        '20260309231938_hardening_indexes',
        '20260309232603_elite_hardening_soft_delete'
    ];

    try {
        console.log('🧹 Cleaning up phantom columns that cause conflicts...');

        // Drop columns that might have been partially added in failed attempts
        const cleanupQueries = [
            'ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "request_id"',
            'ALTER TABLE "clients" DROP COLUMN IF EXISTS "deleted_at"',
            'ALTER TABLE "opportunities" DROP COLUMN IF EXISTS "deleted_at"',
            'ALTER TABLE "products" DROP COLUMN IF EXISTS "deleted_at"',
            'ALTER TABLE "tasks" DROP COLUMN IF EXISTS "deleted_at"',
            'ALTER TABLE "tenants" DROP COLUMN IF EXISTS "plan"',
            'ALTER TABLE "tenants" DROP COLUMN IF EXISTS "settings"',
            'DROP TABLE IF EXISTS "actions" CASCADE',
            'DROP TABLE IF EXISTS "conditions" CASCADE',
            'DROP TABLE IF EXISTS "triggers" CASCADE',
            'DROP TABLE IF EXISTS "automations" CASCADE'
        ];

        for (const query of cleanupQueries) {
            try {
                await prisma.$executeRawUnsafe(query);
                console.log(`✅ Executed: ${query}`);
            } catch (e) {
                console.log(`⚠️ Skip: ${query} (Error: ${e.message})`);
            }
        }

        console.log('🗑️ Resetting migration history records...');
        for (const migration of migrationsToReset) {
            try {
                await prisma.$executeRawUnsafe(
                    `DELETE FROM "_prisma_migrations" WHERE "migration_name" = $1`,
                    migration
                );
                console.log(`✅ Removed record for: ${migration}`);
            } catch (e) {
                console.log(`⚠️ Skip record removal for ${migration}`);
            }
        }

        console.log('✨ Database is now in a clean state for "prisma migrate deploy".');
    } catch (error) {
        console.error('❌ Critical error during reset:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
