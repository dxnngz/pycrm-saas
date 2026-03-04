import { prisma } from '../../core/prisma.js';
export class ClientService {
    async getAllClients(tenantId, page = 1, limit = 10, search = '') {
        const offset = (page - 1) * limit;
        const whereClause = { tenant_id: tenantId };
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }
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
    async updateClientById(tenantId, id, data) {
        // Find first to ensure tenant check, then update (Prisma update does not support multiple where unique easily if it's not a single unique constraint without a compound)
        const client = await prisma.client.findFirst({ where: { id, tenant_id: tenantId } });
        if (!client)
            throw { code: 'P2025' }; // Mock Prisma not found error for controller catching
        return await prisma.client.update({
            where: { id },
            data
        });
    }
    async deleteClientById(tenantId, id) {
        const client = await prisma.client.findFirst({ where: { id, tenant_id: tenantId } });
        if (!client)
            throw { code: 'P2025' };
        return await prisma.client.delete({
            where: { id }
        });
    }
    async getClientOpportunitiesById(tenantId, id) {
        return await prisma.opportunity.findMany({
            where: { client_id: id, tenant_id: tenantId },
            orderBy: { created_at: 'desc' }
        });
    }
}
export const clientService = new ClientService();
