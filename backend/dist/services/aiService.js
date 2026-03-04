import { query } from '../db.js';
/**
 * Calculates a unified AI Lead Score (0-100) and Win Probability (0-100%)
 * using a mathematical heuristic model based on interactions, time elapsed, and monetary value.
 */
export const calculateLeadScore = async (opportunityId) => {
    const oppResult = await query(`
        SELECT 
            amount, 
            status, 
            interactions,
            EXTRACT(DAY FROM (CURRENT_DATE - created_at)) as days_open
        FROM opportunities
        WHERE id = $1
    `, [opportunityId]);
    if (oppResult.rows.length === 0) {
        throw new Error('Oportunidad no encontrada');
    }
    const opp = oppResult.rows[0];
    // AI Logical Factors:
    const interactions = parseInt(opp.interactions) || 0;
    const daysOpen = parseFloat(opp.days_open) || 0;
    const amount = parseFloat(opp.amount) || 0;
    // 1. Logistic Regression Model (Basic Approach)
    // P(Win) = 1 / (1 + e^-(B0 + B1*Interactions + B2*DaysOpen + B3*Amount))
    // We assign heuristic Weights (B):
    // Interacting is positive (e.g., +0.5 per interaction)
    // Taking too long is negative (e.g., -0.05 per day)
    // Very high amounts are harder to close but highly valuable (e.g., -0.0001 per Euro)
    const B0 = -1.0; // Base intercept
    const B1 = 0.5; // Interactions weight
    const B2 = -0.05; // Days open weight
    const B3 = -0.00005; // Amount weight
    const z = B0 + (B1 * interactions) + (B2 * daysOpen) + (B3 * amount);
    // Logistic Function
    const probabilityRaw = 1 / (1 + Math.exp(-z));
    // Win Probability in Percentage (0-100)
    let winProbability = Math.round(probabilityRaw * 100);
    // If the opportunity is already won or lost, the probability becomes absolute.
    if (opp.status === 'ganado')
        winProbability = 100;
    if (opp.status === 'perdido')
        winProbability = 0;
    // 2. Lead Score Calculation (0-100 scale)
    // Score mixes activity health with monetary value normalization.
    let baseScore = 50;
    // +2 for each interaction, max +30
    baseScore += Math.min(interactions * 2, 30);
    // Penalty for becoming cold (no interactions over many days)
    if (daysOpen > 30 && interactions < 2) {
        baseScore -= 20;
    }
    // Boost if probability is high
    if (winProbability > 70) {
        baseScore += 10;
    }
    // Normalize to 0-100
    const leadScore = Math.max(0, Math.min(100, Math.round(baseScore)));
    return {
        winProbability,
        leadScore,
        factors: {
            interactions,
            daysOpen,
            amount
        }
    };
};
