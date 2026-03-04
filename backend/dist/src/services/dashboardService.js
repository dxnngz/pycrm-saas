import { query } from '../db.js';
export const getDashboardMetrics = async () => {
    // 1. Monthly Sales (Ventas mensuales) - Sum of amount for 'ganado' status in the current month
    const monthlySalesResult = await query(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM opportunities
        WHERE status = 'ganado'
        AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    `);
    const monthlySales = parseFloat(monthlySalesResult.rows[0].total);
    // 2. Conversion by Stage (Conversión por etapa) - Basically win rate (% of closed deals that were won)
    const conversionResult = await query(`
        SELECT 
            COUNT(*) FILTER (WHERE status = 'ganado') as won,
            COUNT(*) FILTER (WHERE status IN ('ganado', 'perdido')) as closed
        FROM opportunities
    `);
    const { won, closed } = conversionResult.rows[0];
    const conversionRate = parseInt(closed) > 0 ? (parseInt(won) / parseInt(closed)) * 100 : 0;
    // 3. Average Ticket (Ticket promedio)
    const avgTicketResult = await query(`
        SELECT COALESCE(AVG(amount), 0) as average
        FROM opportunities
        WHERE status = 'ganado'
    `);
    const averageTicket = parseFloat(avgTicketResult.rows[0].average);
    // 4. Sales Rep Performance (Rendimiento por vendedor)
    const repPerformanceResult = await query(`
        SELECT u.id, u.name, COALESCE(SUM(o.amount), 0) as total_sales, COUNT(o.id) as deals_won
        FROM users u
        LEFT JOIN opportunities o ON u.id = o.assigned_to AND o.status = 'ganado'
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
    return {
        monthlySales,
        conversionRate,
        averageTicket,
        repPerformance
    };
};
