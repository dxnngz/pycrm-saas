import { prisma } from '../../core/prisma.js';

export class AIService {
    async calculateLeadScore(opportunityId: number) {
        const opportunity = await prisma.opportunity.findUnique({
            where: { id: opportunityId },
            include: { client: true }
        });

        if (!opportunity) {
            throw new Error('Oportunidad no encontrada');
        }

        // Simulación de un modelo de IA para Lead Scoring 
        // En un caso real esto llamaría a un modelo de ML (OpenAI, Gemini, modelo propio)

        // Base score dependiente del estatus
        let baseScore = 50;
        if (opportunity.status === 'ganado') baseScore += 40;
        if (opportunity.status === 'perdido') baseScore -= 30;

        // Factores por cantidad (Simulación)
        const numericAmount = opportunity.amount ? Number(opportunity.amount) : 0;
        const amountScore = numericAmount > 5000 ? 15 : (numericAmount > 1000 ? 5 : 0);

        // Score aleatorio que imita variación predictiva (±10%)
        const predictiveVariance = Math.floor(Math.random() * 20) - 10;

        let finalScore = baseScore + amountScore + predictiveVariance;

        // Limitar entre 0 y 100
        if (finalScore > 100) finalScore = 100;
        if (finalScore < 0) finalScore = 0;

        // Generar una justificación mockeada en base al modelo
        const classification = finalScore >= 80 ? 'HIGH' : finalScore >= 50 ? 'MEDIUM' : 'LOW';
        const recommendation = classification === 'HIGH'
            ? 'Prioridad Ataque: Fuerte probabilidad de conversión. Sugerimos agendar reunión de cierre.'
            : classification === 'MEDIUM'
                ? 'Nutrición del Lead: Mantener contacto regular. Enviar material de casos de éxito.'
                : 'Prioridad Baja: Riesgo de cancelación o pérdida. Repensar estrategia comercial.';

        return {
            opportunityId,
            score: finalScore,
            classification,
            recommendation,
            factors: {
                amount: amountScore > 0 ? 'Favorable' : 'Neutral',
                historicalData: 'Analizado',
                engagement: 'Estable'
            },
            calculatedAt: new Date()
        };
    }
}

export const aiService = new AIService();
