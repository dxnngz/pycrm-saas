import * as dashboardService from '../services/dashboardService.js';
export const getMetrics = async (req, res, next) => {
    try {
        const period = req.query.period || 'monthly';
        const metrics = await dashboardService.getDashboardMetrics(period);
        res.json(metrics);
    }
    catch (err) {
        next(err);
    }
};
