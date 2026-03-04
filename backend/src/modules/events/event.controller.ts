import { Request, Response } from 'express';
import { eventService } from './event.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';

export const getEvents = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const events = await eventService.getEventsByUser(userId, startDate, endDate);
    res.json(events);
});

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const tenantId = (req as any).user.tenantId;
    let clientId = req.body.client_id;
    if (clientId) clientId = parseInt(clientId);

    const eventData = { ...req.body, user_id: userId, client_id: clientId };
    const event = await eventService.createEvent(eventData, tenantId);
    res.status(201).json(event);
});

export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const eventId = parseInt(req.params.id as string);
    if (req.body.client_id) req.body.client_id = parseInt(req.body.client_id);

    const event = await eventService.updateEventById(eventId, userId, req.body);
    if (!event) {
        throw new AppError('Evento no encontrado o no autorizado', 404);
    }

    res.json(event);
});

export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const eventId = parseInt(req.params.id as string);

    const deleted = await eventService.deleteEventById(eventId, userId);
    if (!deleted) {
        throw new AppError('Evento no encontrado o no autorizado', 404);
    }

    res.json({ message: 'Evento eliminado correctamente' });
});
