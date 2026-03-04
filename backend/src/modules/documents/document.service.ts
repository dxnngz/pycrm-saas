import { prisma } from '../../core/prisma.js';
import { Prisma } from '@prisma/client';

export class DocumentService {
    async getAllDocuments(page: number = 1, limit: number = 10, search: string = '') {
        const offset = (page - 1) * limit;

        const whereClause: Prisma.DocumentWhereInput = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                {
                    client: {
                        name: { contains: search, mode: 'insensitive' as const }
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

    async createDocument(data: { client_id?: number | null; opportunity_id?: number | null; name: string; type: string; status: string; amount?: number | null }, tenantId: number) {
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

    async updateDocumentById(id: number, data: { client_id?: number | null; opportunity_id?: number | null; name: string; type: string; status: string; amount?: number | null }, version?: number) {
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

    async deleteDocumentById(id: number) {
        return await prisma.document.delete({
            where: { id }
        });
    }
}

export const documentService = new DocumentService();
