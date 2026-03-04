import { prisma } from '../../core/prisma.js';
import { Client } from '@prisma/client';

export class ClientService {

    async getAllClients(page: number = 1, limit: number = 10, search: string = '') {
        const offset = (page - 1) * limit;

        const whereClause = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { company: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } }
            ]
        } : {};

        const [clients, total] = await Promise.all([
            prisma.client.findMany({
                where: whereClause,
                skip: offset,
                take: limit,
                orderBy: { created_at: 'desc' }
            }),
            prisma.client.count({ where: whereClause })
        ]);

        return {
            data: clients,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async createClient(data: Omit<Partial<Client>, 'id' | 'created_at' | 'updated_at' | 'tenant_id'> & { name: string }, tenantId: number): Promise<Client> {
        return await prisma.client.create({
            data: {
                ...data,
                tenant_id: tenantId,
                status: data.status || 'activo' // Ensure status is set, default to 'activo' if not provided
            }
        });
    }

    async updateClientById(id: number, data: { name?: string; company?: string; email?: string; phone?: string; status?: string }) {
        return await prisma.client.update({
            where: { id },
            data
        });
    }

    async deleteClientById(id: number) {
        return await prisma.client.delete({
            where: { id }
        });
    }

    async getClientOpportunitiesById(id: number) {
        return await prisma.opportunity.findMany({
            where: { client_id: id },
            orderBy: { created_at: 'desc' }
        });
    }
}

export const clientService = new ClientService();
