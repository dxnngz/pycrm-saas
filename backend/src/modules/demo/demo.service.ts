import { prisma } from '../../core/prisma.js';

type DemoSeedResult = {
    created: {
        clients: number;
        products: number;
        opportunities: number;
        tasks: number;
        events: number;
        documents: number;
        contacts: number;
    };
};

export const demoService = {
    getTenantSnapshot: async (tenantId: number) => {
        const [clients, products, opportunities, tasks, events, documents, contacts] = await Promise.all([
            prisma.client.count({ where: { tenant_id: tenantId, deleted_at: null } }),
            prisma.product.count({ where: { tenant_id: tenantId, deleted_at: null } }),
            prisma.opportunity.count({ where: { tenant_id: tenantId, deleted_at: null } }),
            prisma.task.count({ where: { tenant_id: tenantId, deleted_at: null } }),
            prisma.event.count({ where: { tenant_id: tenantId, deleted_at: null } }),
            prisma.document.count({ where: { tenant_id: tenantId, deleted_at: null } }),
            prisma.contact.count({ where: { tenant_id: tenantId, deleted_at: null } }),
        ]);

        return { clients, products, opportunities, tasks, events, documents, contacts };
    },

    seedTenantDemoData: async (tenantId: number, userId?: number): Promise<DemoSeedResult> => {
        const existing = await demoService.getTenantSnapshot(tenantId);
        const hasAny =
            existing.clients > 0 ||
            existing.products > 0 ||
            existing.opportunities > 0 ||
            existing.tasks > 0 ||
            existing.events > 0 ||
            existing.documents > 0 ||
            existing.contacts > 0;

        if (hasAny) {
            return {
                created: { clients: 0, products: 0, opportunities: 0, tasks: 0, events: 0, documents: 0, contacts: 0 },
            };
        }

        const now = new Date();
        const addDays = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

        const result = await prisma.$transaction(async (tx) => {
            const products = await tx.product.createMany({
                data: [
                    { tenant_id: tenantId, name: 'PyCRM Starter', description: 'CRM básico para empezar rápido', price: '49.00', category: 'SaaS' },
                    { tenant_id: tenantId, name: 'PyCRM Pro', description: 'Pipeline + documentos + automatizaciones', price: '129.00', category: 'SaaS' },
                    { tenant_id: tenantId, name: 'PyCRM Enterprise', description: 'Seguridad avanzada y reporting', price: '299.00', category: 'SaaS' },
                    { tenant_id: tenantId, name: 'Onboarding', description: 'Configuración y formación inicial', price: '499.00', category: 'Services' },
                ],
            });

            const clients = await tx.client.createMany({
                data: [
                    { tenant_id: tenantId, name: 'Atlas Retail', company: 'Atlas Retail Group', email: 'contact@atlas-retail.com', phone: '+34 600 111 222', status: 'activo' },
                    { tenant_id: tenantId, name: 'Nova Logistics', company: 'Nova Logistics', email: 'hello@novalogistics.com', phone: '+34 600 333 444', status: 'activo' },
                    { tenant_id: tenantId, name: 'Lumen Tech', company: 'Lumen Tech', email: 'team@lumentech.io', phone: '+34 600 555 666', status: 'activo' },
                    { tenant_id: tenantId, name: 'BlueStone Finance', company: 'BlueStone Finance', email: 'ops@bluestone.finance', phone: '+34 600 777 888', status: 'activo' },
                    { tenant_id: tenantId, name: 'Orchid Hotels', company: 'Orchid Hotels', email: 'sales@orchidhotels.com', phone: '+34 600 999 000', status: 'activo' },
                    { tenant_id: tenantId, name: 'GreenField Energy', company: 'GreenField Energy', email: 'contact@greenfield.energy', phone: '+34 611 123 456', status: 'activo' },
                    { tenant_id: tenantId, name: 'Pulse Fitness', company: 'Pulse Fitness', email: 'info@pulsefitness.com', phone: '+34 611 234 567', status: 'activo' },
                    { tenant_id: tenantId, name: 'Cobalt Media', company: 'Cobalt Media', email: 'studio@cobaltmedia.com', phone: '+34 611 345 678', status: 'activo' },
                ],
            });

            const createdClients = await tx.client.findMany({
                where: { tenant_id: tenantId, deleted_at: null },
                orderBy: { id: 'asc' },
            });

            const pickClient = (index: number) => createdClients[Math.min(index, createdClients.length - 1)];

            const opportunitiesData = [
                { client_id: pickClient(0)?.id, product: 'PyCRM Pro', amount: '5400.00', status: 'pendiente' },
                { client_id: pickClient(1)?.id, product: 'PyCRM Starter', amount: '1800.00', status: 'pendiente' },
                { client_id: pickClient(2)?.id, product: 'PyCRM Enterprise', amount: '12000.00', status: 'pendiente' },
                { client_id: pickClient(3)?.id, product: 'Onboarding', amount: '900.00', status: 'ganado' },
                { client_id: pickClient(4)?.id, product: 'PyCRM Pro', amount: '7200.00', status: 'ganado' },
                { client_id: pickClient(5)?.id, product: 'PyCRM Starter', amount: '600.00', status: 'perdido' },
                { client_id: pickClient(6)?.id, product: 'PyCRM Pro', amount: '3600.00', status: 'pendiente' },
                { client_id: pickClient(7)?.id, product: 'PyCRM Enterprise', amount: '24000.00', status: 'pendiente' },
            ].filter((o) => Boolean(o.client_id));

            const opportunities = await Promise.all(opportunitiesData.map((o, idx) => tx.opportunity.create({
                data: {
                    tenant_id: tenantId,
                    client_id: o.client_id!,
                    assigned_to: userId,
                    product: o.product,
                    amount: o.amount,
                    status: o.status,
                    estimated_close_date: addDays(10 + idx * 7),
                    interactions: idx % 4,
                }
            })));

            const tasksData = [
                { title: 'Llamar al cliente para validar requisitos', priority: 'Alta', completed: false, deadline: addDays(2), client_id: pickClient(0)?.id },
                { title: 'Preparar propuesta económica', priority: 'Alta', completed: false, deadline: addDays(4), client_id: pickClient(2)?.id },
                { title: 'Enviar contrato para revisión', priority: 'Media', completed: false, deadline: addDays(7), client_id: pickClient(4)?.id },
                { title: 'Seguimiento post-demo', priority: 'Media', completed: false, deadline: addDays(3), client_id: pickClient(1)?.id },
                { title: 'Actualizar pipeline y probabilidad', priority: 'Baja', completed: true, deadline: addDays(-2), client_id: pickClient(3)?.id },
            ].filter((t) => Boolean(t.client_id));

            const tasks = await tx.task.createMany({
                data: tasksData.map((t) => ({
                    tenant_id: tenantId,
                    user_id: userId,
                    client_id: t.client_id!,
                    title: t.title,
                    priority: t.priority,
                    completed: t.completed,
                    deadline: t.deadline,
                })),
            });

            const eventsData = [
                { title: 'Demo PyCRM', description: 'Presentación del producto y Q&A', start: addDays(1), end: addDays(1), color: '#4f46e5', client_id: pickClient(0)?.id },
                { title: 'Reunión de seguimiento', description: 'Revisión de propuesta', start: addDays(5), end: addDays(5), color: '#10b981', client_id: pickClient(2)?.id },
                { title: 'Cierre comercial', description: 'Últimos detalles y firma', start: addDays(12), end: addDays(12), color: '#f59e0b', client_id: pickClient(4)?.id },
            ].filter((e) => Boolean(e.client_id));

            const events = await Promise.all(eventsData.map((e) => tx.event.create({
                data: {
                    tenant_id: tenantId,
                    user_id: userId,
                    client_id: e.client_id!,
                    title: e.title,
                    description: e.description,
                    start_date: new Date(e.start.getTime() + 10 * 60 * 60 * 1000),
                    end_date: new Date(e.end.getTime() + 11 * 60 * 60 * 1000),
                    color: e.color,
                }
            })));

            const documentsData = [
                { name: 'Propuesta Q3 - Atlas Retail', type: 'Quote', status: 'Pending', amount: '5400.00', client_id: pickClient(0)?.id, opp: opportunities[0]?.id },
                { name: 'Contrato - Orchid Hotels', type: 'Contract', status: 'Paid', amount: '7200.00', client_id: pickClient(4)?.id, opp: opportunities[4]?.id },
                { name: 'Factura Onboarding - BlueStone', type: 'Invoice', status: 'Paid', amount: '900.00', client_id: pickClient(3)?.id, opp: opportunities[3]?.id },
            ].filter((d) => Boolean(d.client_id));

            const documents = await Promise.all(documentsData.map((d) => tx.document.create({
                data: {
                    tenant_id: tenantId,
                    client_id: d.client_id!,
                    opportunity_id: d.opp,
                    name: d.name,
                    type: d.type,
                    status: d.status,
                    amount: d.amount,
                }
            })));

            const contactsData = [
                { client_id: pickClient(0)?.id, type: 'email', description: 'Interés inicial en PyCRM Pro' },
                { client_id: pickClient(2)?.id, type: 'call', description: 'Validación de requisitos con el equipo de ventas' },
                { client_id: pickClient(4)?.id, type: 'meeting', description: 'Revisión de contrato y condiciones' },
            ].filter((c) => Boolean(c.client_id));

            const contacts = await tx.contact.createMany({
                data: contactsData.map((c, idx) => ({
                    tenant_id: tenantId,
                    client_id: c.client_id!,
                    type: c.type,
                    description: c.description,
                    contact_date: addDays(-idx),
                })),
            });

            return {
                created: {
                    clients: clients.count,
                    products: products.count,
                    opportunities: opportunities.length,
                    tasks: tasks.count,
                    events: events.length,
                    documents: documents.length,
                    contacts: contacts.count,
                }
            } satisfies DemoSeedResult;
        });

        return result;
    },
};

