import OpenAI from 'openai';
import { prisma } from '../../core/prisma.js';
export class AIService {
    openai;
    constructor() {
        const isGroq = !!process.env.GROQ_API_KEY;
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || 'dummy_key',
            baseURL: isGroq ? 'https://api.groq.com/openai/v1' : undefined
        });
    }
    async calculateLeadScore(opportunityId, tenantId) {
        const opportunity = await prisma.opportunity.findFirst({
            where: { id: opportunityId, tenant_id: tenantId },
            include: { client: true, documents: true }
        });
        if (!opportunity)
            throw new Error('Oportunidad no encontrada');
        // Fallback or actual OpenAI call (using a mock if no key to prevent instant crashes)
        if (!process.env.OPENAI_API_KEY && !process.env.GROQ_API_KEY) {
            console.warn("API de IA no configurada, usando scoring por defecto.");
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
        try {
            const modelName = process.env.GROQ_API_KEY ? "llama-3.1-8b-instant" : "gpt-4o-mini";
            const response = await this.openai.chat.completions.create({
                model: modelName,
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
        catch (error) {
            console.error("AI Scoring Error:", error.message || error);
            console.warn("Retornando scoring de fallback por fallo en la API externa.");
            return this.mockLeadScore(opportunity);
        }
    }
    async copilotQueryStream(tenantId, query, res) {
        if (!process.env.OPENAI_API_KEY && !process.env.GROQ_API_KEY) {
            res.write(`data: ${JSON.stringify({ error: "La clave de IA no está configurada. Por favor, configura OPENAI_API_KEY o GROQ_API_KEY en tu entorno para habilitar el Copiloto de forma gratuita." })}\n\n`);
            res.end();
            return;
        }
        // 1. Context Extraction (RAG)
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
        const modelName = process.env.GROQ_API_KEY ? "llama-3.3-70b-versatile" : "gpt-4o";
        try {
            const stream = await this.openai.chat.completions.create({
                model: modelName,
                messages: [{ role: "system", content: "Eres un asistente experto en ventas B2B y análisis de pipeline." }, { role: "user", content: prompt }],
                stream: true
            });
            for await (const chunk of stream) {
                const text = chunk.choices[0]?.delta?.content || '';
                if (text) {
                    res.write(`data: ${JSON.stringify({ text })}\n\n`);
                }
            }
            res.write(`data: ${JSON.stringify({ done: true, context_used: recentOpps.length + recentTasks.length })}\n\n`);
            res.end();
        }
        catch (error) {
            console.error("[Copilot AI Error]:", error);
            let errorMessage = "Lo siento, ocurrió un error interno al contactar al motor de Inteligencia Artificial.";
            if (error.status === 401) {
                errorMessage = "La API Key de Groq/OpenAI no es válida (Error 401 Unauthorized). Por favor, verifica que la has copiado correctamente en Render.";
            }
            else if (error.status === 429) {
                errorMessage = "Has excedido el límite de peticiones gratuitas. Por favor, intenta de nuevo más tarde.";
            }
            else if (error.message) {
                errorMessage = `Error del servidor de IA: ${error.message}`;
            }
            // In SSE, if it fails early we can send an error chunk, else we just terminate
            res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
            res.end();
        }
    }
    mockLeadScore(opportunity) {
        let baseScore = 50;
        if (opportunity.status === 'ganado')
            baseScore += 40;
        if (opportunity.status === 'perdido')
            baseScore -= 30;
        const numericAmount = opportunity.amount ? Number(opportunity.amount) : 0;
        const amountScore = numericAmount > 5000 ? 15 : (numericAmount > 1000 ? 5 : 0);
        let finalScore = baseScore + amountScore + (Math.floor(Math.random() * 20) - 10);
        if (finalScore > 100)
            finalScore = 100;
        if (finalScore < 0)
            finalScore = 0;
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
