import { prisma } from '../../core/prisma.js';
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
            clients: 30,
            products: 10,
            opportunities: 45,
            tasks: 30,
            events: 12,
            documents: 15,
            contacts: 24,
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
                { tenant_id: tenantId, name: 'Integración Email', description: 'Sincronización con Gmail/Outlook', price: '29.00', category: 'Add-ons' },
                { tenant_id: tenantId, name: 'Firma digital', description: 'Firma de contratos desde PyCRM', price: '39.00', category: 'Add-ons' },
                { tenant_id: tenantId, name: 'Automatizaciones', description: 'Workflows y recordatorios inteligentes', price: '59.00', category: 'Add-ons' },
                { tenant_id: tenantId, name: 'Export avanzado', description: 'Exportación a CSV/PDF y reportes', price: '19.00', category: 'Add-ons' },
            ];

            const existingProducts = await tx.product.findMany({
                where: { tenant_id: tenantId, deleted_at: null },
                select: { name: true },
            });
            const existingProductNames = new Set(existingProducts.map((p) => String(p.name || '').trim()));
            const productsToCreate: typeof baseProducts = [];
            for (const p of baseProducts) {
                if (productsToCreate.length >= missing.products) break;
                if (!existingProductNames.has(p.name)) productsToCreate.push(p);
            }
            for (let i = productsToCreate.length; i < missing.products; i++) {
                productsToCreate.push({
                    tenant_id: tenantId,
                    name: `Pack extra ${i + 1}`,
                    description: 'Módulo adicional para demo',
                    price: String(15 + (i % 6) * 10) + '.00',
                    category: 'Add-ons',
                });
            }
            const products = productsToCreate.length > 0 ? await tx.product.createMany({ data: productsToCreate }) : { count: 0 };

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
                { tenant_id: tenantId, name: 'Marina Insurance', company: 'Marina Insurance', email: 'hello@marina-insurance.com', phone: '+34 633 101 202', status: 'activo' },
                { tenant_id: tenantId, name: 'Iberia Travel', company: 'Iberia Travel', email: 'sales@iberiatravel.es', phone: '+34 633 303 404', status: 'activo' },
                { tenant_id: tenantId, name: 'Horizon Education', company: 'Horizon Education', email: 'info@horizon-edu.com', phone: '+34 633 505 606', status: 'activo' },
                { tenant_id: tenantId, name: 'Vertex Manufacturing', company: 'Vertex Manufacturing', email: 'contact@vertex-mfg.com', phone: '+34 633 707 808', status: 'activo' },
                { tenant_id: tenantId, name: 'Solstice Pharma', company: 'Solstice Pharma', email: 'ops@solsticepharma.com', phone: '+34 644 101 202', status: 'activo' },
                { tenant_id: tenantId, name: 'Nimbus Telecom', company: 'Nimbus Telecom', email: 'hello@nimbus-telecom.com', phone: '+34 644 303 404', status: 'activo' },
                { tenant_id: tenantId, name: 'RiverStone Real Estate', company: 'RiverStone Real Estate', email: 'sales@riverstone-re.es', phone: '+34 644 505 606', status: 'activo' },
                { tenant_id: tenantId, name: 'Sunrise Automotive', company: 'Sunrise Automotive', email: 'info@sunrise-auto.com', phone: '+34 644 707 808', status: 'activo' },
                { tenant_id: tenantId, name: 'Polar IT Services', company: 'Polar IT Services', email: 'contact@polar-it.com', phone: '+34 655 101 202', status: 'activo' },
                { tenant_id: tenantId, name: 'Beacon Security', company: 'Beacon Security', email: 'hello@beacon-sec.com', phone: '+34 655 303 404', status: 'activo' },
                { tenant_id: tenantId, name: 'Evergreen Consulting', company: 'Evergreen Consulting', email: 'info@evergreen-consulting.es', phone: '+34 655 505 606', status: 'activo' },
                { tenant_id: tenantId, name: 'Zenith Sports', company: 'Zenith Sports', email: 'sales@zenithsports.es', phone: '+34 655 707 808', status: 'activo' },
                { tenant_id: tenantId, name: 'Coral Restaurants', company: 'Coral Restaurants', email: 'contact@coral-restaurants.com', phone: '+34 666 101 202', status: 'activo' },
                { tenant_id: tenantId, name: 'Skyline Architecture', company: 'Skyline Architecture', email: 'hello@skyline-arch.com', phone: '+34 666 303 404', status: 'activo' },
                { tenant_id: tenantId, name: 'Minted Payments', company: 'Minted Payments', email: 'info@minted-payments.com', phone: '+34 666 505 606', status: 'activo' },
                { tenant_id: tenantId, name: 'Opal HR', company: 'Opal HR', email: 'sales@opal-hr.com', phone: '+34 666 707 808', status: 'activo' },
                { tenant_id: tenantId, name: 'Forge Tools', company: 'Forge Tools', email: 'contact@forgetools.es', phone: '+34 677 101 202', status: 'activo' },
                { tenant_id: tenantId, name: 'Citrus eCommerce', company: 'Citrus eCommerce', email: 'hello@citrus-commerce.com', phone: '+34 677 303 404', status: 'activo' },
            ];

            const existingClients = await tx.client.findMany({
                where: { tenant_id: tenantId, deleted_at: null },
                select: { name: true },
            });
            const existingClientNames = new Set(existingClients.map((c) => String(c.name || '').trim()));
            const clientsToCreate: typeof baseClients = [];
            for (const c of baseClients) {
                if (clientsToCreate.length >= missing.clients) break;
                if (!existingClientNames.has(c.name)) clientsToCreate.push(c);
            }
            for (let i = clientsToCreate.length; i < missing.clients; i++) {
                const n = String(i + 1).padStart(2, '0');
                clientsToCreate.push({
                    tenant_id: tenantId,
                    name: `Demo Company ${n}`,
                    company: `Demo Company ${n}`,
                    email: `demo${tenantId}.${n}@example.com`,
                    phone: `+34 690 ${100 + i} ${200 + (i % 80)}`,
                    status: 'activo',
                });
            }

            const clients = clientsToCreate.length > 0 ? await tx.client.createMany({ data: clientsToCreate }) : { count: 0 };

            const createdClients = await tx.client.findMany({
                where: { tenant_id: tenantId, deleted_at: null },
                orderBy: { id: 'asc' },
            });

            const pickClient = (index: number) => createdClients[Math.min(index, createdClients.length - 1)];

            const productsNow = await tx.product.findMany({
                where: { tenant_id: tenantId, deleted_at: null },
                select: { name: true },
                orderBy: { id: 'asc' },
            });
            const productNames = productsNow.map((p) => String(p.name || '').trim()).filter(Boolean);
            const pickProduct = (index: number) => productNames[index % (productNames.length || 1)] || 'PyCRM Pro';

            const opportunities: Array<{ id: number }> = [];
            for (let idx = 0; idx < missing.opportunities; idx++) {
                const status =
                    idx % 7 === 0 ? wonStatus :
                        idx % 7 === 1 ? lostStatus :
                            idx % 2 === 0 ? openStatus : openStatusAlt;
                const isWon = status === wonStatus;
                const isLost = status === lostStatus;
                const amount = 900 + (idx % 18) * 350 + (idx % 3) * 125;
                const clientId = pickClient(idx)?.id ?? null;
                const opp = await tx.opportunity.create({
                    data: ({
                        tenant_id: tenantId,
                        client_id: clientId,
                        assigned_to: userId ?? null,
                        product: pickProduct(idx),
                        amount: String(amount.toFixed(2)),
                        status,
                        estimated_close_date: addDays(7 + (idx % 18) * 3),
                        closed_at: (isWon || isLost) ? addDays(-(3 + (idx % 21))) : null,
                        lost_reason: isLost ? defaultLossReason : null,
                        lost_reason_detail: isLost ? 'Cliente prioriza otra alternativa por presupuesto.' : null,
                        source: idx % 3 === 0 ? 'Inbound' : idx % 3 === 1 ? 'Outbound' : 'Referral',
                        probability: isWon ? 100 : isLost ? 0 : 30 + (idx % 6) * 10,
                        next_action_at: isWon || isLost ? null : addDays((idx % 9) - 3),
                        interactions: idx % 7,
                        notes: idx % 4 === 0 ? 'Pendiente de validación con decisor.' : idx % 4 === 1 ? 'Se ha enviado propuesta, esperando respuesta.' : null,
                    } as any)
                });
                opportunities.push({ id: opp.id });
            }

            const taskTitles = [
                'Llamar al cliente para validar requisitos',
                'Enviar propuesta económica',
                'Revisar objeciones del cliente',
                'Preparar demo personalizada',
                'Confirmar asistentes a la reunión',
                'Actualizar pipeline y probabilidad',
                'Solicitar datos fiscales',
                'Coordinar firma de contrato',
                'Planificar onboarding',
                'Enviar resumen de la reunión',
            ];
            const tasksToCreate = Array.from({ length: missing.tasks }, (_, idx) => {
                const title = taskTitles[idx % taskTitles.length] + (idx >= taskTitles.length ? ` #${idx + 1}` : '');
                const priority = idx % 6 === 0 ? 'Alta' : idx % 3 === 0 ? 'Media' : 'Baja';
                const completed = idx % 7 === 0;
                const deadline = addDays((idx % 16) - 4);
                const clientId = pickClient(idx)?.id ?? null;
                return {
                    tenant_id: tenantId,
                    user_id: userId ?? null,
                    client_id: clientId,
                    title,
                    priority,
                    completed,
                    deadline,
                };
            });
            const tasks = tasksToCreate.length > 0 ? await tx.task.createMany({ data: tasksToCreate }) : { count: 0 };

            const events: Array<{ id: number }> = [];
            for (let idx = 0; idx < missing.events; idx++) {
                const clientId = pickClient(idx)?.id ?? null;
                const start = addDays(1 + (idx % 14));
                const ev = await tx.event.create({
                    data: {
                        tenant_id: tenantId,
                        user_id: userId ?? null,
                        client_id: clientId,
                        title: idx % 3 === 0 ? 'Demo PyCRM' : idx % 3 === 1 ? 'Reunión de seguimiento' : 'Cierre comercial',
                        description: idx % 3 === 0 ? 'Presentación del producto y Q&A' : idx % 3 === 1 ? 'Revisión de propuesta y próximos pasos' : 'Últimos detalles y firma',
                        start_date: new Date(start.getTime() + 10 * 60 * 60 * 1000),
                        end_date: new Date(start.getTime() + 11 * 60 * 60 * 1000),
                        color: idx % 3 === 0 ? '#4f46e5' : idx % 3 === 1 ? '#10b981' : '#f59e0b',
                    }
                });
                events.push({ id: ev.id });
            }

            const existingOpps = await tx.opportunity.findMany({
                where: { tenant_id: tenantId, deleted_at: null },
                select: { id: true },
                orderBy: { id: 'desc' },
                take: 80,
            });
            const oppIds = [...opportunities.map((o) => o.id), ...existingOpps.map((o) => o.id)];

            const documents: Array<{ id: number }> = [];
            for (let idx = 0; idx < missing.documents; idx++) {
                const clientId = pickClient(idx)?.id ?? null;
                const kind = idx % 3 === 0 ? 'Quote' : idx % 3 === 1 ? 'Contract' : 'Invoice';
                const status = idx % 4 === 0 ? 'Paid' : 'Pending';
                const amount = 600 + (idx % 20) * 250;
                const oppId = oppIds.length > 0 ? oppIds[idx % oppIds.length] : null;
                const doc = await tx.document.create({
                    data: {
                        tenant_id: tenantId,
                        client_id: clientId,
                        opportunity_id: oppId,
                        name: `${kind} - ${pickClient(idx)?.name || 'Cliente'} #${idx + 1}`,
                        type: kind,
                        status,
                        amount: String(amount.toFixed(2)),
                    }
                });
                documents.push({ id: doc.id });
            }

            const contactsToCreate = Array.from({ length: missing.contacts }, (_, idx) => {
                const clientId = pickClient(idx)?.id ?? null;
                const type = idx % 4 === 0 ? 'email' : idx % 4 === 1 ? 'call' : idx % 4 === 2 ? 'meeting' : 'note';
                const description = idx % 4 === 0
                    ? 'Email: interés inicial y preguntas sobre pricing'
                    : idx % 4 === 1
                        ? 'Llamada: validación de requisitos y próximos pasos'
                        : idx % 4 === 2
                            ? 'Reunión: revisión de propuesta y condiciones'
                            : 'Nota interna: seguimiento pendiente';
                return {
                    tenant_id: tenantId,
                    client_id: clientId,
                    type,
                    description,
                    contact_date: addDays(-(1 + (idx % 20))),
                };
            });
            const contacts = contactsToCreate.length > 0 ? await tx.contact.createMany({ data: contactsToCreate }) : { count: 0 };

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
