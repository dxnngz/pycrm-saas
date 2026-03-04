import { prisma } from '../../core/prisma.js';

export interface ContactInput {
    client_id: number;
    type: string;
    description: string;
    contact_date?: string;
}

export class ContactService {
    async getContactsByClientId(clientId: number) {
        return await prisma.contact.findMany({
            where: { client_id: clientId },
            orderBy: { contact_date: 'desc' }
        });
    }

    async createContact(data: ContactInput, tenantId: number) {
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
