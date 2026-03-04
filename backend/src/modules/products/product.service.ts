import { prisma } from '../../core/prisma.js';
import { Prisma } from '@prisma/client';

export class ProductService {
    async getAllProducts(tenantId: number, page: number = 1, limit: number = 10, search: string = '') {
        const offset = (page - 1) * limit;

        const whereClause: Prisma.ProductWhereInput = { tenant_id: tenantId };
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' as const } },
                { description: { contains: search, mode: 'insensitive' as const } },
                { category: { contains: search, mode: 'insensitive' as const } }
            ];
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where: whereClause,
                orderBy: { created_at: 'desc' },
                skip: offset,
                take: limit
            }),
            prisma.product.count({ where: whereClause })
        ]);

        return {
            products,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async createProduct(tenantId: number, data: { name: string; description?: string; price: number; category?: string }) {
        return await prisma.product.create({
            data: {
                tenant_id: tenantId,
                name: data.name,
                description: data.description,
                price: data.price,
                category: data.category
            }
        });
    }

    async updateProductById(tenantId: number, id: number, data: { name?: string; description?: string; price?: number; category?: string }) {
        const product = await prisma.product.findFirst({ where: { id, tenant_id: tenantId } });
        if (!product) throw { code: 'P2025' };

        return await prisma.product.update({
            where: { id },
            data
        });
    }

    async deleteProductById(tenantId: number, id: number) {
        const product = await prisma.product.findFirst({ where: { id, tenant_id: tenantId } });
        if (!product) throw { code: 'P2025' };

        return await prisma.product.delete({
            where: { id }
        });
    }

    async getProductById(tenantId: number, id: number) {
        return await prisma.product.findFirst({
            where: { id, tenant_id: tenantId }
        });
    }
}

export const productService = new ProductService();
