import { Request, Response } from 'express';
import { taskService } from './task.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';

export const getTasks = asyncHandler(async (req: Request, res: Response) => {
    const { limit, search, cursor } = req.query as any;
    const user = (req as any).user;

    const tasks = await taskService.getTasksByUserId(
        user.tenantId,
        user.userId,
        {
            limit: limit ? parseInt(limit as string) : 10,
            search: search as string,
            cursor: cursor ? parseInt(cursor as string) : undefined
        }
    );
    res.json(tasks);
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const tenantId = (req as any).user.tenantId;

    const task = await taskService.createTask({ ...req.body, userId }, tenantId);
    res.status(201).json(task);
});

export const toggleTaskCompletion = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const userId = (req as any).user.userId;
    const tenantId = (req as any).user.tenantId;

    const task = await taskService.toggleTaskCompletionStatus(tenantId, id, userId);
    if (!task) {
        throw new AppError('Tarea no encontrada', 404);
    }

    res.json(task);
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const userId = (req as any).user.userId;
    const tenantId = (req as any).user.tenantId;

    const deleted = await taskService.deleteTaskById(tenantId, id, userId);
    if (!deleted) {
        throw new AppError('Tarea no encontrada o no autorizada', 404);
    }

    res.json({ message: 'Tarea eliminada correctamente' });
});
