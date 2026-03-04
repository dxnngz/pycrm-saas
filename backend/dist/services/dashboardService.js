import { query } from '../db.js';
export const getDashboardMetrics = async (period = 'monthly') => {
    const isYearly = period === 'yearly';
    // 1. Sales Metrics
    const salesResult = await query(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM opportunities
        WHERE status = 'ganado'
        ${isYearly
        ? "AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)"
        : "AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)"}
    `);
    const totalSales = parseFloat(salesResult.rows[0].total);
    // 2. Conversion & Average Ticket
    const metricsResult = await query(`
        SELECT 
            COUNT(*) FILTER (WHERE status = 'ganado') as won,
            COUNT(*) FILTER (WHERE status IN ('ganado', 'perdido')) as closed,
            COALESCE(AVG(amount) FILTER (WHERE status = 'ganado'), 0) as avg_ticket
        FROM opportunities
        ${isYearly
        ? "WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)"
        : "WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)"}
    `);
    const { won, closed, avg_ticket } = metricsResult.rows[0];
    const conversionRate = parseInt(closed) > 0 ? (parseInt(won) / parseInt(closed)) * 100 : 0;
    const averageTicket = parseFloat(avg_ticket);
    // 3. Sales Rep Performance
    const repPerformanceResult = await query(`
        SELECT u.id, u.name, COALESCE(SUM(o.amount), 0) as total_sales, COUNT(o.id) as deals_won
        FROM users u
        LEFT JOIN opportunities o ON u.id = o.assigned_to 
            AND o.status = 'ganado'
            ${isYearly
        ? "AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)"
        : "AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)"}
        WHERE u.role = 'empleado' OR u.role = 'admin'
        GROUP BY u.id, u.name
        ORDER BY total_sales DESC
    `);
    const repPerformance = repPerformanceResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        total_sales: parseFloat(row.total_sales),
        deals_won: parseInt(row.deals_won)
    }));
    // 4. Sales Chart Data
    let chartData = [];
    if (isYearly) {
        const chartResult = await query(`
            SELECT 
                TO_CHAR(date_trunc('month', created_at), 'Mon') as name,
                SUM(amount) as sales
            FROM opportunities
            WHERE status = 'ganado'
            AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            GROUP BY date_trunc('month', created_at)
            ORDER BY date_trunc('month', created_at)
        `);
        chartData = chartResult.rows.map(r => ({ name: r.name, sales: parseFloat(r.sales) }));
    }
    else {
        const chartResult = await query(`
            SELECT 
                TO_CHAR(created_at, 'DD/MM') as name,
                SUM(amount) as sales
            FROM opportunities
            WHERE status = 'ganado'
            AND created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY date_trunc('day', created_at), TO_CHAR(created_at, 'DD/MM')
            ORDER BY date_trunc('day', created_at)
        `);
        chartData = chartResult.rows.map(r => ({ name: r.name, sales: parseFloat(r.sales) }));
    }
    return {
        totalSales,
        conversionRate,
        averageTicket,
        repPerformance,
        chartData
    };
};
