import { taskService } from './task.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
export const getTasks = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    const tasks = await taskService.getTasksByUserId(tenantId, userId);
    res.json(tasks);
});
export const createTask = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    const task = await taskService.createTask({ ...req.body, userId }, tenantId);
    res.status(201).json(task);
});
export const toggleTaskCompletion = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    const task = await taskService.toggleTaskCompletionStatus(tenantId, id, userId);
    if (!task) {
        throw new AppError('Tarea no encontrada', 404);
    }
    res.json(task);
});
export const deleteTask = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    const deleted = await taskService.deleteTaskById(tenantId, id, userId);
    if (!deleted) {
        throw new AppError('Tarea no encontrada o no autorizada', 404);
    }
    res.json({ message: 'Tarea eliminada correctamente' });
});
