import { prisma } from '../../core/prisma.js';
export class DocumentService {
    async getAllDocuments(page = 1, limit = 10, search = '') {
        const offset = (page - 1) * limit;
        const whereClause = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                {
                    client: {
                        name: { contains: search, mode: 'insensitive' }
                    }
                }
            ]
        } : {};
        const [documents, total] = await Promise.all([
            prisma.document.findMany({
                where: whereClause,
                include: {
                    client: {
                        select: { name: true }
                    }
                },
                orderBy: { created_at: 'desc' },
                skip: offset,
                take: limit
            }),
            prisma.document.count({ where: whereClause })
        ]);
        const mappedData = documents.map(doc => ({
            ...doc,
            client_name: doc.client?.name || null
        }));
        return {
            documents: mappedData,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }
    async createDocument(data, tenantId) {
        return await prisma.document.create({
            data: {
                client_id: data.client_id,
                opportunity_id: data.opportunity_id,
                tenant_id: tenantId,
                name: data.name,
                type: data.type,
                status: data.status,
                amount: data.amount,
            }
        });
    }
    async updateDocumentById(id, data, version) {
        if (version !== undefined) {
            return await prisma.document.update({
                where: { id, version },
                data: {
                    client_id: data.client_id,
                    opportunity_id: data.opportunity_id,
                    name: data.name,
                    type: data.type,
                    status: data.status,
                    amount: data.amount,
                    version: { increment: 1 }
                }
            });
        }
        return await prisma.document.update({
            where: { id },
            data: {
                client_id: data.client_id,
                opportunity_id: data.opportunity_id,
                name: data.name,
                type: data.type,
                status: data.status,
                amount: data.amount
            }
        });
    }
    async deleteDocumentById(id) {
        return await prisma.document.delete({
            where: { id }
        });
    }
}
export const documentService = new DocumentService();
