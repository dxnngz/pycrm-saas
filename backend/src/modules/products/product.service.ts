import { prisma } from '../../core/prisma.js';
import { Prisma } from '@prisma/client';

export class ProductService {
    async getAllProducts(page: number = 1, limit: number = 10, search: string = '') {
        const offset = (page - 1) * limit;

        const whereClause: Prisma.ProductWhereInput = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { description: { contains: search, mode: 'insensitive' as const } },
                { category: { contains: search, mode: 'insensitive' as const } }
            ]
        } : {};

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

    async createProduct(data: { name: string; description?: string; price: number; category?: string }) {
        return await prisma.product.create({
            data: {
                tenant_id: 1,
                name: data.name,
                description: data.description,
                price: data.price,
                category: data.category
            }
        });
    }

    async updateProductById(id: number, data: { name?: string; description?: string; price?: number; category?: string }) {
        return await prisma.product.update({
            where: { id },
            data
        });
    }

    async deleteProductById(id: number) {
        return await prisma.product.delete({
            where: { id }
        });
    }

    async getProductById(id: number) {
        return await prisma.product.findUnique({
            where: { id }
        });
    }
}

export const productService = new ProductService();
