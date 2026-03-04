import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Start seeding...');

    // Create default tenant
    const tenant = await prisma.tenant.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            name: 'Empresa Demo SaaS',
        },
    });

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@saas.com' },
        update: {},
        create: {
            tenant_id: tenant.id,
            name: 'Administrador Sistema',
            email: 'admin@saas.com',
            password: hashedPassword,
            role: 'admin',
        },
    });

    console.log({ tenant, admin });
    console.log('✅ Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
