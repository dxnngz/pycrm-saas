import { prisma } from '../core/prisma.js';
import { addEmailJob } from './queue.js';
import { logger } from '../utils/logger.js';

export const processTaskReminders = async () => {
    logger.info('[TaskReminders] Checking for upcoming tasks...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

    try {
        // Find tasks due tomorrow that are not completed
        const upcomingTasks = await prisma.task.findMany({
            where: {
                deadline: {
                    gte: startOfTomorrow,
                    lte: endOfTomorrow
                },
                completed: false
            },
            include: {
                user: {
                    select: { email: true, name: true }
                }
            }
        });

        logger.info(`[TaskReminders] Found ${upcomingTasks.length} tasks due tomorrow.`);

        for (const task of upcomingTasks) {
            if (task.user?.email) {
                await addEmailJob(
                    task.user.email,
                    `Recordatorio: Tarea "${task.title}" vence mañana`,
                    `
                        <h2>Hola, ${task.user.name}</h2>
                        <p>Te recordamos que la tarea <strong>"${task.title}"</strong> tiene como fecha límite mañana.</p>
                        <p>Por favor, asegúrate de completarla a tiempo.</p>
                        <hr />
                        <p>PyCRM Automation Engine</p>
                    `
                );
            }
        }

        return upcomingTasks.length;
    } catch (error) {
        logger.error(error, '[TaskReminders] Error processing reminders:');
        throw error;
    }
};
