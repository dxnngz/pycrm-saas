import { Router } from 'express';
import { authenticateToken } from '../auth.js';
import { validate } from '../middleware/validate.js';
import { taskSchema } from '../schemas/apiSchemas.js';
import { getTasks, createTask, toggleTaskCompletion, deleteTask } from '../controllers/taskController.js';
const router = Router();
/**
 * @openapi
 * /api/tasks:
 *   get:
 *     summary: Obtener todas las tareas del usuario
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, getTasks);
/**
 * @openapi
 * /api/tasks:
 *   post:
 *     summary: Crear una nueva tarea
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticateToken, validate(taskSchema), createTask);
/**
 * @openapi
 * /api/tasks/{id}/toggle:
 *   patch:
 *     summary: Alternar estado de completado de una tarea
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/toggle', authenticateToken, toggleTaskCompletion);
/**
 * @openapi
 * /api/tasks/{id}:
 *   delete:
 *     summary: Eliminar una tarea
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticateToken, deleteTask);
export default router;
