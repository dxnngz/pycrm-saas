import * as taskService from '../services/taskService.js';
export const getTasks = async (req, res, next) => {
    const userId = req.user.userId;
    try {
        const tasks = await taskService.getTasksByUserId(userId);
        res.json(tasks);
    }
    catch (err) {
        next(err);
    }
};
export const createTask = async (req, res, next) => {
    const userId = req.user.userId;
    try {
        const task = await taskService.createTask({ ...req.body, userId });
        res.status(201).json(task);
    }
    catch (err) {
        next(err);
    }
};
export const toggleTaskCompletion = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.userId;
    try {
        const task = await taskService.toggleTaskCompletionStatus(id, userId);
        if (!task)
            return res.status(404).json({ message: 'Tarea no encontrada' });
        res.json(task);
    }
    catch (err) {
        next(err);
    }
};
export const deleteTask = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.userId;
    try {
        const deleted = await taskService.deleteTaskById(id, userId);
        if (!deleted)
            return res.status(404).json({ message: 'Tarea no encontrada' });
        res.json({ message: 'Tarea eliminada correctamente' });
    }
    catch (err) {
        next(err);
    }
};
