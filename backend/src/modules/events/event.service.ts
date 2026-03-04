import { prisma } from '../../core/prisma.js';

export class EventService {
    async getEventsByUser(userId: number, startDate?: string, endDate?: string) {
        let whereClause: any = { user_id: userId };

        if (startDate && endDate) {
            whereClause.start_date = { gte: new Date(startDate) };
            whereClause.end_date = { lte: new Date(endDate) };
        }

        return await prisma.event.findMany({
            where: whereClause,
            orderBy: { start_date: 'asc' }
        });
    }

    async createEvent(eventData: { user_id: number; client_id?: number | null; title: string; description?: string; start_date: string; end_date: string; color?: string }, tenantId: number) {
        return await prisma.event.create({
            data: {
                user_id: eventData.user_id,
                tenant_id: tenantId,
                client_id: eventData.client_id || null,
                title: eventData.title,
                description: eventData.description,
                start_date: new Date(eventData.start_date),
                end_date: new Date(eventData.end_date),
                color: eventData.color || '#3b82f6'
            }
        });
    }

    async updateEventById(id: number, userId: number, eventData: { client_id?: number | null; title?: string; description?: string; start_date?: string; end_date?: string; color?: string }) {
        // Find existing event checking ownership
        const existingEvent = await prisma.event.findFirst({
            where: { id, user_id: userId }
        });

        if (!existingEvent) return null;

        const updateData: any = { ...eventData };
        if (eventData.start_date) updateData.start_date = new Date(eventData.start_date);
        if (eventData.end_date) updateData.end_date = new Date(eventData.end_date);

        return await prisma.event.update({
            where: { id },
            data: updateData
        });
    }

    async deleteEventById(id: number, userId: number) {
        const result = await prisma.event.deleteMany({
            where: { id, user_id: userId }
        });

        return result.count > 0;
    }
}

export const eventService = new EventService();
