import { prisma } from '../../core/prisma.js';
export class ProductService {
    async getAllProducts(tenantId, page = 1, limit = 10, search = '') {
        const offset = (page - 1) * limit;
        const whereClause = { tenant_id: tenantId };
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } }
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
    async createProduct(tenantId, data) {
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
    async updateProductById(tenantId, id, data) {
        const product = await prisma.product.findFirst({ where: { id, tenant_id: tenantId } });
        if (!product)
            throw { code: 'P2025' };
        return await prisma.product.update({
            where: { id },
            data
        });
    }
    async deleteProductById(tenantId, id) {
        const product = await prisma.product.findFirst({ where: { id, tenant_id: tenantId } });
        if (!product)
            throw { code: 'P2025' };
        return await prisma.product.delete({
            where: { id }
        });
    }
    async getProductById(tenantId, id) {
        return await prisma.product.findFirst({
            where: { id, tenant_id: tenantId }
        });
    }
}
export const productService = new ProductService();
