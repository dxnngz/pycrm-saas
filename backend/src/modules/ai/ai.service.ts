import OpenAI from 'openai';
import { prisma } from '../../core/prisma.js';

export class AIService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'dummy_key'
        });
    }

    async calculateLeadScore(opportunityId: number, tenantId: number) {
        const opportunity = await prisma.opportunity.findFirst({
            where: { id: opportunityId, tenant_id: tenantId },
            include: { client: true, documents: true }
        });

        if (!opportunity) throw new Error('Oportunidad no encontrada');

        // Fallback or actual OpenAI call (using a mock if no key to prevent instant crashes)
        if (!process.env.OPENAI_API_KEY) {
            console.warn("OPENAI_API_KEY no configurado, usando scoring por defecto.");
            return this.mockLeadScore(opportunity);
        }

        const prompt = `
        Analiza esta oportunidad comercial B2B y darnos una puntuación del 0 al 100 y una recomendación.
        Cliente: ${opportunity.client?.name} (${opportunity.client?.company})
        Producto: ${opportunity.product}
        Monto: $${opportunity.amount}
        Estado: ${opportunity.status}
        Interacciones: ${opportunity.interactions}
        Documentos adjuntos: ${opportunity.documents.length}
        
        Devuelve estrictamente un JSON con este formato:
        {
            "score": number, 
            "classification": "HIGH" | "MEDIUM" | "LOW", 
            "recommendation": "string", 
            "factors": {"amount": "string", "engagement": "string", "historicalData": "string"}
        }`;

        const response = await this.openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }]
        });

        const parsed = JSON.parse(response.choices[0].message.content || '{}');
        return {
            opportunityId,
            ...parsed,
            calculatedAt: new Date()
        };
    }

    async copilotQuery(tenantId: number, query: string) {
        if (!process.env.OPENAI_API_KEY) {
            return {
                answer: "La clave de OpenAI no está configurada. Por favor, configura la variable de entorno OPENAI_API_KEY para habilitar el Copiloto AI.",
                context_used: 0
            };
        }

        // 1. Context Extraction (RAG)
        // For an MVP Copilot, we pull recent stats from the tenant.
        // In a production scenario, we'd use vector search or more specific queries based on NLP intent.
        const [recentOpps, recentTasks, clientsCount] = await Promise.all([
            prisma.opportunity.findMany({
                where: { tenant_id: tenantId, status: { not: 'ganado' } },
                orderBy: { amount: 'desc' },
                take: 5,
                include: { client: { select: { name: true, company: true } } }
            }),
            prisma.task.findMany({
                where: { tenant_id: tenantId, completed: false },
                orderBy: { deadline: 'asc' },
                take: 5
            }),
            prisma.client.count({ where: { tenant_id: tenantId } })
        ]);

        const context = `
            Contexto del CRM (Tenant ID: ${tenantId}):
            - Total de clientes: ${clientsCount}
            - Top 5 Oportunidades Pendientes: ${JSON.stringify(recentOpps.map(o => ({ product: o.product, amount: o.amount, status: o.status, client: o.client?.company })))}
            - Próximas 5 Tareas: ${JSON.stringify(recentTasks.map(t => ({ title: t.title, priority: t.priority, deadline: t.deadline })))}
        `;

        const prompt = `
        Eres el copiloto inteligente (AI) del PyCRM. 
        Responde a la pregunta del usuario utilizando la información del contexto proporcionada.
        Si la respuesta no está en el contexto, usa tu conocimiento general sobre ventas B2B, pero aclara que es un consejo general.
        Responde en formato Markdown limpio.
        
        Contexto de datos: ${context}
        
        Pregunta del usuario: ${query}
        `;

        const response = await this.openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: "Eres un asistente experto en ventas B2B y análisis de pipeline." }, { role: "user", content: prompt }]
        });

        return {
            answer: response.choices[0].message.content,
            context_used: recentOpps.length + recentTasks.length
        };
    }

    private mockLeadScore(opportunity: any) {
        let baseScore = 50;
        if (opportunity.status === 'ganado') baseScore += 40;
        if (opportunity.status === 'perdido') baseScore -= 30;

        const numericAmount = opportunity.amount ? Number(opportunity.amount) : 0;
        const amountScore = numericAmount > 5000 ? 15 : (numericAmount > 1000 ? 5 : 0);
        let finalScore = baseScore + amountScore + (Math.floor(Math.random() * 20) - 10);
        if (finalScore > 100) finalScore = 100;
        if (finalScore < 0) finalScore = 0;

        return {
            opportunityId: opportunity.id,
            score: finalScore,
            classification: finalScore >= 80 ? 'HIGH' : finalScore >= 50 ? 'MEDIUM' : 'LOW',
            recommendation: finalScore >= 80 ? 'Prioridad Alta' : 'Nutrición del Lead',
            factors: { amount: amountScore > 0 ? 'Favorable' : 'Neutral', historicalData: 'Analizado', engagement: 'Estable' },
            calculatedAt: new Date()
        };
    }
}

export const aiService = new AIService();
