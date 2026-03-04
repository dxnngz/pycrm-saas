import * as opportunityService from '../services/opportunityService.js';
import * as aiService from '../services/aiService.js';
export const getOpportunities = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const opportunities = await opportunityService.getAllOpportunities(page, limit, search);
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
