import { prisma } from '../../core/prisma.js';
import { ResilienceService } from '../../core/resilience.service.js';
import { tenantService } from '../tenants/tenant.service.js';

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
        const targets = {
            clients: 12,
            products: 6,
            opportunities: 18,
            tasks: 12,
            events: 6,
            documents: 6,
            contacts: 10,
        };

        const missing = {
            clients: Math.max(0, targets.clients - existing.clients),
            products: Math.max(0, targets.products - existing.products),
            opportunities: Math.max(0, targets.opportunities - existing.opportunities),
            tasks: Math.max(0, targets.tasks - existing.tasks),
            events: Math.max(0, targets.events - existing.events),
            documents: Math.max(0, targets.documents - existing.documents),
            contacts: Math.max(0, targets.contacts - existing.contacts),
        };

        const shouldCreateAnything =
            missing.clients > 0 ||
            missing.products > 0 ||
            missing.opportunities > 0 ||
            missing.tasks > 0 ||
            missing.events > 0 ||
            missing.documents > 0 ||
            missing.contacts > 0;

        if (!shouldCreateAnything) {
            return {
                created: { clients: 0, products: 0, opportunities: 0, tasks: 0, events: 0, documents: 0, contacts: 0 },
            };
        }

        const now = new Date();
        const addDays = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

        const stages = await tenantService.getPipelineStages(tenantId);
        const openStages = stages.filter((s) => s.category === 'open');
        const wonStages = stages.filter((s) => s.category === 'won');
        const lostStages = stages.filter((s) => s.category === 'lost');

        const openStatus = openStages[0]?.id || 'pendiente';
        const openStatusAlt = openStages[1]?.id || openStatus;
        const wonStatus = wonStages[0]?.id || 'ganado';
        const lostStatus = lostStages[0]?.id || 'perdido';

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { settings: true, plan: true }
        });
        const settings = (tenant?.settings || {}) as Record<string, unknown>;
        const lossReasons = Array.isArray((settings as any).lossReasons)
            ? ((settings as any).lossReasons as unknown[]).map((v) => String(v || '').trim()).filter(Boolean)
            : [];
        const defaultLossReason = lossReasons[0] || 'Precio';

        const [
            hasClosedAt,
            hasNotes,
            hasLostReason,
            hasLostReasonDetail,
            hasSource,
            hasProbability,
            hasNextActionAt,
            hasInteractions,
        ] = await Promise.all([
            ResilienceService.checkColumnExists('opportunities', 'closed_at'),
            ResilienceService.checkColumnExists('opportunities', 'notes'),
            ResilienceService.checkColumnExists('opportunities', 'lost_reason'),
            ResilienceService.checkColumnExists('opportunities', 'lost_reason_detail'),
            ResilienceService.checkColumnExists('opportunities', 'source'),
            ResilienceService.checkColumnExists('opportunities', 'probability'),
            ResilienceService.checkColumnExists('opportunities', 'next_action_at'),
            ResilienceService.checkColumnExists('opportunities', 'interactions'),
        ]);

        const result = await prisma.$transaction(async (tx) => {
            await tx.tenant.update({
                where: { id: tenantId },
                data: {
                    plan: 'enterprise',
                    settings: {
                        ...(settings as any),
                        lossReasons: lossReasons.length > 0 ? lossReasons : ['Precio', 'Competencia', 'Sin respuesta', 'Timing', 'Sin encaje'],
                    }
                }
            });

            const baseProducts = [
                { tenant_id: tenantId, name: 'PyCRM Starter', description: 'CRM básico para empezar rápido', price: '49.00', category: 'SaaS' },
                { tenant_id: tenantId, name: 'PyCRM Pro', description: 'Pipeline + documentos + automatizaciones', price: '129.00', category: 'SaaS' },
                { tenant_id: tenantId, name: 'PyCRM Enterprise', description: 'Seguridad avanzada y reporting', price: '299.00', category: 'SaaS' },
                { tenant_id: tenantId, name: 'Onboarding', description: 'Configuración y formación inicial', price: '499.00', category: 'Servicios' },
                { tenant_id: tenantId, name: 'Soporte Premium', description: 'Soporte prioritario y SLA', price: '79.00', category: 'Servicios' },
                { tenant_id: tenantId, name: 'Formación equipo', description: 'Sesión de formación para el equipo', price: '249.00', category: 'Servicios' },
            ];

            const existingProducts = await tx.product.findMany({
                where: { tenant_id: tenantId, deleted_at: null },
                select: { name: true },
            });
            const existingProductNames = new Set(existingProducts.map((p) => String(p.name || '').trim()));
            const productsToCreate = baseProducts.filter((p) => !existingProductNames.has(p.name)).slice(0, missing.products);
            const products = productsToCreate.length > 0
                ? await tx.product.createMany({ data: productsToCreate })
                : { count: 0 };

            const baseClients = [
                { tenant_id: tenantId, name: 'Atlas Retail', company: 'Atlas Retail Group', email: 'contact@atlas-retail.com', phone: '+34 600 111 222', status: 'activo' },
                { tenant_id: tenantId, name: 'Nova Logistics', company: 'Nova Logistics', email: 'hello@novalogistics.com', phone: '+34 600 333 444', status: 'activo' },
                { tenant_id: tenantId, name: 'Lumen Tech', company: 'Lumen Tech', email: 'team@lumentech.io', phone: '+34 600 555 666', status: 'activo' },
                { tenant_id: tenantId, name: 'BlueStone Finance', company: 'BlueStone Finance', email: 'ops@bluestone.finance', phone: '+34 600 777 888', status: 'activo' },
                { tenant_id: tenantId, name: 'Orchid Hotels', company: 'Orchid Hotels', email: 'sales@orchidhotels.com', phone: '+34 600 999 000', status: 'activo' },
                { tenant_id: tenantId, name: 'GreenField Energy', company: 'GreenField Energy', email: 'contact@greenfield.energy', phone: '+34 611 123 456', status: 'activo' },
                { tenant_id: tenantId, name: 'Pulse Fitness', company: 'Pulse Fitness', email: 'info@pulsefitness.com', phone: '+34 611 234 567', status: 'activo' },
                { tenant_id: tenantId, name: 'Cobalt Media', company: 'Cobalt Media', email: 'studio@cobaltmedia.com', phone: '+34 611 345 678', status: 'activo' },
                { tenant_id: tenantId, name: 'SilverPeak Legal', company: 'SilverPeak Legal', email: 'contact@silverpeak.legal', phone: '+34 622 111 222', status: 'activo' },
                { tenant_id: tenantId, name: 'Aurora Health', company: 'Aurora Health', email: 'hello@aurora.health', phone: '+34 622 333 444', status: 'activo' },
                { tenant_id: tenantId, name: 'Keystone Construction', company: 'Keystone Construction', email: 'sales@keystone.build', phone: '+34 622 555 666', status: 'activo' },
                { tenant_id: tenantId, name: 'Saffron Foods', company: 'Saffron Foods', email: 'info@saffronfoods.es', phone: '+34 622 777 888', status: 'activo' },
            ];

            const existingClients = await tx.client.findMany({
                where: { tenant_id: tenantId, deleted_at: null },
                select: { name: true },
            });
            const existingClientNames = new Set(existingClients.map((c) => String(c.name || '').trim()));
            const clientsToCreate = baseClients.filter((c) => !existingClientNames.has(c.name)).slice(0, missing.clients);

            const clients = clientsToCreate.length > 0
                ? await tx.client.createMany({ data: clientsToCreate })
                : { count: 0 };

            const createdClients = await tx.client.findMany({
                where: { tenant_id: tenantId, deleted_at: null },
                orderBy: { id: 'asc' },
            });

            const pickClient = (index: number) => createdClients[Math.min(index, createdClients.length - 1)];

            const opportunities: Array<{ id: number }> = [];
            const opportunitySeed = [
                { client_id: pickClient(0)?.id, product: 'PyCRM Pro', amount: '5400.00', status: openStatus, interactions: 2, next_action_at: addDays(1) },
                { client_id: pickClient(1)?.id, product: 'PyCRM Starter', amount: '1800.00', status: openStatusAlt, interactions: 1, next_action_at: addDays(2) },
                { client_id: pickClient(2)?.id, product: 'PyCRM Enterprise', amount: '12000.00', status: openStatus, interactions: 3, next_action_at: addDays(3) },
                { client_id: pickClient(3)?.id, product: 'Onboarding', amount: '900.00', status: wonStatus, interactions: 5 },
                { client_id: pickClient(4)?.id, product: 'PyCRM Pro', amount: '7200.00', status: wonStatus, interactions: 4 },
                { client_id: pickClient(5)?.id, product: 'PyCRM Starter', amount: '600.00', status: lostStatus, interactions: 2 },
                { client_id: pickClient(6)?.id, product: 'Soporte Premium', amount: '948.00', status: openStatusAlt, interactions: 0, next_action_at: addDays(-1) },
                { client_id: pickClient(7)?.id, product: 'PyCRM Enterprise', amount: '24000.00', status: openStatus, interactions: 1, next_action_at: addDays(5) },
                { client_id: pickClient(8)?.id, product: 'Formación equipo', amount: '1494.00', status: openStatus, interactions: 0, next_action_at: addDays(4) },
                { client_id: pickClient(9)?.id, product: 'PyCRM Pro', amount: '3600.00', status: openStatusAlt, interactions: 2, next_action_at: addDays(6) },
                { client_id: pickClient(10)?.id, product: 'PyCRM Starter', amount: '900.00', status: lostStatus, interactions: 1 },
                { client_id: pickClient(11)?.id, product: 'PyCRM Pro', amount: '9600.00', status: wonStatus, interactions: 6 },
            ].filter((o) => Boolean(o.client_id));

            const oppToCreate = opportunitySeed.slice(0, missing.opportunities);
            for (let idx = 0; idx < oppToCreate.length; idx++) {
                const o = oppToCreate[idx]!;
                const isWon = o.status === wonStatus;
                const isLost = o.status === lostStatus;
                const data: any = {
                    tenant_id: tenantId,
                    client_id: o.client_id!,
                    assigned_to: userId ?? null,
                    product: o.product,
                    amount: o.amount,
                    status: o.status,
                    estimated_close_date: addDays(10 + idx * 7),
                };
                if (hasClosedAt) data.closed_at = (isWon || isLost) ? addDays(-(20 + idx)) : null;
                if (hasLostReason) data.lost_reason = isLost ? defaultLossReason : null;
                if (hasLostReasonDetail) data.lost_reason_detail = isLost ? 'Cliente prioriza otra alternativa por presupuesto.' : null;
                if (hasSource) data.source = idx % 2 === 0 ? 'Inbound' : 'Outbound';
                if (hasProbability) data.probability = isWon ? 100 : isLost ? 0 : 35 + (idx % 4) * 10;
                if (hasNextActionAt) data.next_action_at = (o as any).next_action_at ? new Date((o as any).next_action_at) : null;
                if (hasInteractions) data.interactions = (o as any).interactions ?? (idx % 4);
                if (hasNotes) data.notes = idx % 3 === 0 ? 'Pendiente de validación con decisor.' : null;
                const opp = await tx.opportunity.create({
                    data
                });
                opportunities.push({ id: opp.id });
            }

            const tasksData = [
                { title: 'Llamar al cliente para validar requisitos', priority: 'Alta', completed: false, deadline: addDays(2), client_id: pickClient(0)?.id },
                { title: 'Preparar propuesta económica', priority: 'Alta', completed: false, deadline: addDays(4), client_id: pickClient(2)?.id },
                { title: 'Enviar contrato para revisión', priority: 'Media', completed: false, deadline: addDays(7), client_id: pickClient(4)?.id },
                { title: 'Seguimiento post-demo', priority: 'Media', completed: false, deadline: addDays(3), client_id: pickClient(1)?.id },
                { title: 'Actualizar pipeline y probabilidad', priority: 'Baja', completed: true, deadline: addDays(-2), client_id: pickClient(3)?.id },
            ].filter((t) => Boolean(t.client_id));

            const tasksToCreate = tasksData.slice(0, missing.tasks);
            const tasks = tasksToCreate.length > 0
                ? await tx.task.createMany({
                    data: tasksToCreate.map((t) => ({
                        tenant_id: tenantId,
                        user_id: userId,
                        client_id: t.client_id!,
                        title: t.title,
                        priority: t.priority,
                        completed: t.completed,
                        deadline: t.deadline,
                    })),
                })
                : { count: 0 };

            const eventsData = [
                { title: 'Demo PyCRM', description: 'Presentación del producto y Q&A', start: addDays(1), end: addDays(1), color: '#4f46e5', client_id: pickClient(0)?.id },
                { title: 'Reunión de seguimiento', description: 'Revisión de propuesta', start: addDays(5), end: addDays(5), color: '#10b981', client_id: pickClient(2)?.id },
                { title: 'Cierre comercial', description: 'Últimos detalles y firma', start: addDays(12), end: addDays(12), color: '#f59e0b', client_id: pickClient(4)?.id },
            ].filter((e) => Boolean(e.client_id));

            const events: Array<{ id: number }> = [];
            const eventsToCreate = eventsData.slice(0, missing.events);
            for (const e of eventsToCreate) {
                const ev = await tx.event.create({
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
                });
                events.push({ id: ev.id });
            }

            const documentsData = [
                { name: 'Propuesta Q3 - Atlas Retail', type: 'Quote', status: 'Pending', amount: '5400.00', client_id: pickClient(0)?.id, opp: opportunities[0]?.id },
                { name: 'Contrato - Orchid Hotels', type: 'Contract', status: 'Paid', amount: '7200.00', client_id: pickClient(4)?.id, opp: opportunities[1]?.id },
                { name: 'Factura Onboarding - BlueStone', type: 'Invoice', status: 'Paid', amount: '900.00', client_id: pickClient(3)?.id, opp: opportunities[2]?.id },
            ].filter((d) => Boolean(d.client_id));

            const documents: Array<{ id: number }> = [];
            const documentsToCreate = documentsData.slice(0, missing.documents);
            for (const d of documentsToCreate) {
                const doc = await tx.document.create({
                    data: {
                        tenant_id: tenantId,
                        client_id: d.client_id!,
                        opportunity_id: d.opp,
                        name: d.name,
                        type: d.type,
                        status: d.status,
                        amount: d.amount,
                    }
                });
                documents.push({ id: doc.id });
            }

            const contactsData = [
                { client_id: pickClient(0)?.id, type: 'email', description: 'Interés inicial en PyCRM Pro' },
                { client_id: pickClient(2)?.id, type: 'call', description: 'Validación de requisitos con el equipo de ventas' },
                { client_id: pickClient(4)?.id, type: 'meeting', description: 'Revisión de contrato y condiciones' },
            ].filter((c) => Boolean(c.client_id));

            const contactsToCreate = contactsData.slice(0, missing.contacts);
            const contacts = contactsToCreate.length > 0
                ? await tx.contact.createMany({
                    data: contactsToCreate.map((c, idx) => ({
                        tenant_id: tenantId,
                        client_id: c.client_id!,
                        type: c.type,
                        description: c.description,
                        contact_date: addDays(-idx),
                    })),
                })
                : { count: 0 };

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
