import { Client } from '@prisma/client';
import { redisCache } from '../../core/redis.js';
import { clientRepository } from '../../repositories/client.repository.js';

export class ClientService {

    async getAllClients(tenantId: number, options: { limit?: number; search?: string; cursor?: number } = {}) {
        const { limit = 10, search = '', cursor } = options;
        const cacheKey = `cache:clients:${tenantId}:l${limit}:s${search}:c${cursor || 0}`;

        return await redisCache.getOrSet(cacheKey, 300, async () => {
            const [clients, total] = await Promise.all([
                clientRepository.findManyPaged(tenantId, { cursor, limit, search }),
                clientRepository.countSearch(tenantId, search)
            ]);

            const hasMore = clients.length > limit;
            const items = hasMore ? clients.slice(0, limit) : clients;
            const lastItem = items[items.length - 1];
            const nextCursor = hasMore ? lastItem?.id : null;

            return {
                data: items,
                total,
                limit,
                nextCursor,
                hasMore
            };
        });
    }

    async createClient(data: Omit<Partial<Client>, 'id' | 'created_at' | 'updated_at' | 'tenant_id'> & { name: string }, tenantId: number): Promise<Client> {
        return await clientRepository.create({
            ...data,
            tenant_id: tenantId,
            status: data.status || 'activo'
        });
    }

    async updateClientById(tenantId: number, id: number, data: { name?: string; company?: string; email?: string; phone?: string; status?: string }) {
        const client = await clientRepository.findUnique(tenantId, id);
        if (!client) throw { code: 'P2025' };

        return await clientRepository.update(tenantId, id, data);
    }

    async deleteClientById(tenantId: number, id: number) {
        const client = await clientRepository.findUnique(tenantId, id);
        if (!client) throw { code: 'P2025' };

        return await clientRepository.delete(tenantId, id);
    }

    async getClientOpportunitiesById(tenantId: number, id: number) {
        return await clientRepository.findOpportunities(tenantId, id);
    }
}

export const clientService = new ClientService();
