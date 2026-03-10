import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting surgical migration reset...');

    const migrationsToReset = [
        '20260309190148_enterprise_features',
        '20260310000934_auth_mfa_update',
        '20260309231938_hardening_indexes',
        '20260309232603_elite_hardening_soft_delete'
    ];

    try {
        for (const migration of migrationsToReset) {
            console.log(`🧹 Removing record for: ${migration}`);
            await prisma.$executeRawUnsafe(
                `DELETE FROM "_prisma_migrations" WHERE "migration_name" = $1`,
                migration
            );
        }
        console.log('✅ Migration history cleaned. Ready for redeploy.');
    } catch (error) {
        console.error('❌ Error during reset:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
