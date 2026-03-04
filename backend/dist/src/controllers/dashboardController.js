import * as dashboardService from '../services/dashboardService.js';
export const getMetrics = async (req, res, next) => {
    try {
        const metrics = await dashboardService.getDashboardMetrics();
        res.json(metrics);
    }
    catch (err) {
        next(err);
    }
};
