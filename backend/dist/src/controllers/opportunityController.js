import * as opportunityService from '../services/opportunityService.js';
export const getOpportunities = async (req, res, next) => {
    try {
        const opportunities = await opportunityService.getAllOpportunities();
        res.json(opportunities);
    }
    catch (err) {
        next(err);
    }
};
export const createOpportunity = async (req, res, next) => {
    try {
        const opportunity = await opportunityService.createOpportunity(req.body);
        res.status(201).json(opportunity);
    }
    catch (err) {
        next(err);
    }
};
export const updateOpportunityStatus = async (req, res, next) => {
    try {
        const opportunity = await opportunityService.updateOpportunityStatusById(req.params.id, req.body.status);
        if (!opportunity)
            return res.status(404).json({ message: 'Oportunidad no encontrada' });
        res.json(opportunity);
    }
    catch (err) {
        next(err);
    }
};
import * as aiService from '../services/aiService.js';
export const getLeadScore = async (req, res, next) => {
    const { id } = req.params;
    try {
        const scoreData = await aiService.calculateLeadScore(parseInt(id));
        res.json(scoreData);
    }
    catch (err) {
        if (err.message === 'Oportunidad no encontrada') {
            return res.status(404).json({ message: err.message });
        }
        next(err);
    }
};
