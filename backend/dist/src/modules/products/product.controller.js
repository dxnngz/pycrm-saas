import { productService } from './product.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
export const getProducts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const tenantId = req.user?.tenantId;
    const result = await productService.getAllProducts(tenantId, page, limit, search);
    res.json(result);
});
export const getProductById = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const id = parseInt(req.params.id);
    const product = await productService.getProductById(tenantId, id);
    if (!product) {
        throw new AppError('Producto no encontrado', 404);
    }
    res.json(product);
});
export const createProduct = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const data = {
        ...req.body,
        price: parseFloat(req.body.price)
    };
    const doc = await productService.createProduct(tenantId, data);
    res.status(201).json(doc);
});
export const updateProduct = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const id = parseInt(req.params.id);
    const data = {
        ...req.body,
        price: req.body.price !== undefined ? parseFloat(req.body.price) : undefined
    };
    try {
        const product = await productService.updateProductById(tenantId, id, data);
        res.json(product);
    }
    catch (error) {
        if (error.code === 'P2025') {
            throw new AppError('Producto no encontrado', 404);
        }
        throw error;
    }
});
export const deleteProduct = asyncHandler(async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        await productService.deleteProductById(tenantId, parseInt(req.params.id));
        res.json({ message: 'Producto eliminado correctamente' });
    }
    catch (error) {
        if (error.code === 'P2025') {
            throw new AppError('Producto no encontrado', 404);
        }
        throw error;
    }
});
