import { prisma } from '../../core/prisma.js';
export class ContactService {
    async getContactsByClientId(tenantId, clientId) {
        return await prisma.contact.findMany({
            where: { client_id: clientId, tenant_id: tenantId },
            orderBy: { contact_date: 'desc' }
        });
    }
    async createContact(data, tenantId) {
        return await prisma.contact.create({
            data: {
                client_id: data.client_id,
                tenant_id: tenantId,
                type: data.type,
                description: data.description,
                contact_date: data.contact_date ? new Date(data.contact_date) : new Date()
            }
        });
    }
}
export const contactService = new ContactService();
