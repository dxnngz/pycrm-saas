import { prisma } from '../../core/prisma.js';
export class ProductService {
    async getAllProducts(page = 1, limit = 10, search = '') {
        const offset = (page - 1) * limit;
        const whereClause = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } }
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
    async createProduct(data) {
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
    async updateProductById(id, data) {
        return await prisma.product.update({
            where: { id },
            data
        });
    }
    async deleteProductById(id) {
        return await prisma.product.delete({
            where: { id }
        });
    }
    async getProductById(id) {
        return await prisma.product.findUnique({
            where: { id }
        });
    }
}
export const productService = new ProductService();
