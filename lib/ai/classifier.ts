import OpenAI from "openai";
import { AI_INTENTS } from "@/lib/ai/intents";
import { AiClassificationResult } from "@/lib/ai/types";

function classifyIntentLocally(message: string): AiClassificationResult {
  const msg = message.toLowerCase().trim();

  if (
    msg.includes("quais pagamentos estão atrasados") ||
    msg.includes("quais pagamentos estao atrasados") ||
    msg.includes("listar pagamentos atrasados") ||
    msg.includes("mostre os pagamentos atrasados")
  ) {
    return { intent: "LIST_OVERDUE_PAYMENTS", confidence: 0.92 };
  }
  
  if (
    msg.includes("quantos alunos ativos") ||
    msg.includes("quantidade de alunos ativos") ||
    msg.includes("total de alunos ativos")
  ) {
    return { intent: "TOTAL_ACTIVE_STUDENTS", confidence: 0.92 };
  }
  
  if (
    msg.includes("resumo financeiro do mês") ||
    msg.includes("resumo financeiro do mes") ||
    msg.includes("mostre um resumo financeiro do mês") ||
    msg.includes("mostre um resumo financeiro do mes")
  ) {
    return { intent: "MONTHLY_FINANCIAL_SUMMARY", confidence: 0.9 };
  }
  
  if (
    msg.includes("quais cursos têm mais alunos") ||
    msg.includes("quais cursos tem mais alunos")
  ) {
    return { intent: "TOP_COURSES", confidence: 0.9 };
  }

  if (
    msg.includes("gerar mensalidades") ||
    msg.includes("gere mensalidades") ||
    msg.includes("gerar mensalidade") ||
    msg.includes("gere mensalidade") ||
    msg.includes("confirmar geração de mensalidades")
  ) {
    return { intent: "GENERATE_MONTHLY_PAYMENTS", confidence: 0.82 };
  }

  if (
    msg.includes("registrar pagamento") ||
    msg.includes("confirmar pagamento") ||
    msg.includes("marcar pagamento como pago") ||
    msg.includes("dar baixa no pagamento")
  ) {
    return { intent: "MARK_PAYMENT_PAID", confidence: 0.82 };
  }

  if (
    msg.includes("quantos alunos") ||
    msg.includes("quantidade de alunos") ||
    msg.includes("total de alunos")
  ) {
    return { intent: "TOTAL_STUDENTS", confidence: 0.9 };
  }

  if (
    msg.includes("matrículas ativas") ||
    msg.includes("matriculas ativas") ||
    msg.includes("total de matrículas ativas") ||
    msg.includes("total de matriculas ativas")
  ) {
    return { intent: "TOTAL_ACTIVE_ENROLLMENTS", confidence: 0.88 };
  }

  if (
    msg.includes("pagamentos atrasados") ||
    msg.includes("quantos pagamentos estão atrasados") ||
    msg.includes("quantos pagamentos estao atrasados")
  ) {
    return { intent: "TOTAL_OVERDUE_PAYMENTS", confidence: 0.88 };
  }

  if (
    msg.includes("pagamentos pendentes") ||
    msg.includes("quantos pagamentos estão pendentes") ||
    msg.includes("quantos pagamentos estao pendentes")
  ) {
    return { intent: "TOTAL_PENDING_PAYMENTS", confidence: 0.88 };
  }

  if (
    msg.includes("receita do mês") ||
    msg.includes("receita do mes") ||
    msg.includes("quanto foi recebido este mês") ||
    msg.includes("quanto foi recebido este mes") ||
    msg.includes("quanto recebi este mês") ||
    msg.includes("quanto recebi este mes")
  ) {
    return { intent: "MONTHLY_REVENUE", confidence: 0.9 };
  }

  if (
    msg.includes("curso mais popular") ||
    msg.includes("cursos mais populares") ||
    msg.includes("qual curso tem mais alunos") ||
    msg.includes("ranking de cursos")
  ) {
    return { intent: "TOP_COURSES", confidence: 0.86 };
  }

  if (
    msg.includes("próximos eventos") ||
    msg.includes("proximos eventos") ||
    msg.includes("eventos próximos") ||
    msg.includes("eventos proximos") ||
    msg.includes("eventos agendados")
  ) {
    return { intent: "UPCOMING_EVENTS", confidence: 0.86 };
  }

  if (
    msg.includes("inadimplente") ||
    msg.includes("inadimplentes") ||
    msg.includes("quem está em atraso") ||
    msg.includes("quem esta em atraso")
  ) {
    return { intent: "LIST_OVERDUE_STUDENTS", confidence: 0.86 };
  }

  return { intent: "CHAT", confidence: 0.4 };
}

export async function classifyIntent(
  client: OpenAI,
  message: string
): Promise<AiClassificationResult> {
  try {
    const response = await client.responses.create({
      model: "gpt-5.4-mini",
      input: [
        {
          role: "system",
          content: `
Você classifica intenções para um sistema de gestão escolar.

Intenções válidas:
${AI_INTENTS.join("\n")}

Regras:
- Retorne apenas JSON válido.
- Formato:
{"intent":"CHAT","confidence":0.95}
- Use CHAT quando a frase for ampla, ambígua ou não corresponder claramente a uma ação/consulta estruturada.
- Confidence deve ser um número entre 0 e 1.
`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      store: false,
    });

    const raw = response.output_text?.trim();

    if (!raw) {
      return classifyIntentLocally(message);
    }

    const parsed = JSON.parse(raw) as AiClassificationResult;

    if (!AI_INTENTS.includes(parsed.intent)) {
      return classifyIntentLocally(message);
    }

    return {
      intent: parsed.intent,
      confidence:
        typeof parsed.confidence === "number" ? parsed.confidence : 0,
    };
  } catch (error) {
    console.error("Erro ao classificar intenção com OpenAI. Usando fallback local.", error);
    return classifyIntentLocally(message);
  }
}