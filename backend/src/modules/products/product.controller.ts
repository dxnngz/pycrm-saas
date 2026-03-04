import { Request, Response } from 'express';
import { productService } from './product.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';

    const result = await productService.getAllProducts(page, limit, search);
    res.json(result);
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const product = await productService.getProductById(id);
    if (!product) {
        throw new AppError('Producto no encontrado', 404);
    }
    res.json(product);
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
    const data = {
        ...req.body,
        price: parseFloat(req.body.price)
    };
    const doc = await productService.createProduct(data);
    res.status(201).json(doc);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const data = {
        ...req.body,
        price: req.body.price !== undefined ? parseFloat(req.body.price) : undefined
    };

    try {
        const product = await productService.updateProductById(id, data);
        res.json(product);
    } catch (error: any) {
        if (error.code === 'P2025') {
            throw new AppError('Producto no encontrado', 404);
        }
        throw error;
    }
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    try {
        await productService.deleteProductById(parseInt(req.params.id as string));
        res.json({ message: 'Producto eliminado correctamente' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            throw new AppError('Producto no encontrado', 404);
        }
        throw error;
    }
});
