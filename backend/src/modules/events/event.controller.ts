import { Request, Response } from 'express';
import { eventService } from './event.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';

export const getEvents = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const events = await eventService.getEventsByUser(userId, startDate, endDate);
    res.json(events);
});

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    let clientId = req.body.client_id ? parseInt(req.body.client_id) : null;
    if (isNaN(clientId as number)) clientId = null;

    const eventData = { ...req.body, user_id: userId, client_id: clientId };
    const event = await eventService.createEvent(eventData, tenantId);
    res.status(201).json(event);
});

export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const eventId = parseInt(req.params.id as string);
    
    let clientId: any = req.body.client_id ? parseInt(req.body.client_id) : undefined;
    if (clientId !== undefined && isNaN(clientId)) clientId = null;
    if (clientId !== undefined) req.body.client_id = clientId;

    const event = await eventService.updateEventById(eventId, userId, req.body);
    if (!event) {
        throw new AppError('Evento no encontrado o no autorizado', 404);
    }

    res.json(event);
});

export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const eventId = parseInt(req.params.id as string);

    const deleted = await eventService.deleteEventById(eventId, userId);
    if (!deleted) {
        throw new AppError('Evento no encontrado o no autorizado', 404);
    }

    res.json({ message: 'Evento eliminado correctamente' });
});
