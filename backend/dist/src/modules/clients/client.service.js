import { prisma } from '../../core/prisma.js';
export class ClientService {
    async getAllClients(page = 1, limit = 10, search = '') {
        const offset = (page - 1) * limit;
        const whereClause = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
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
    async createClient(data, tenantId) {
        return await prisma.client.create({
            data: {
                ...data,
                tenant_id: tenantId,
                status: data.status || 'activo' // Ensure status is set, default to 'activo' if not provided
            }
        });
    }
    async updateClientById(id, data) {
        return await prisma.client.update({
            where: { id },
            data
        });
    }
    async deleteClientById(id) {
        return await prisma.client.delete({
            where: { id }
        });
    }
    async getClientOpportunitiesById(id) {
        return await prisma.opportunity.findMany({
            where: { client_id: id },
            orderBy: { created_at: 'desc' }
        });
    }
}
export const clientService = new ClientService();
