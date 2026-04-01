import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";
import { registerAiAudit } from "@/lib/ai/audit";
import { buildAiContext } from "@/lib/ai/context";
import { classifyIntent } from "@/lib/ai/classifier";
import { extractPaymentActionParams } from "@/lib/ai/extractor";
import { runAiFallback } from "@/lib/ai/fallback";
import {
  generateMonthlyPayments,
  getMonthlyRevenue,
  getTotalStudents,
  getUpcomingEvents,
  listOverdueStudents,
  registerPayment,
  getTotalActiveStudents,
  getMonthlyFinancialSummary,
  listOverduePayments,
} from "@/lib/ai/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isConfirmationMessage(message: string, phrase: string) {
  return message.toLowerCase().includes(phrase.toLowerCase());
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const message = String(body?.message ?? "").trim();

    if (!message) {
      return NextResponse.json(
        { error: "Mensagem obrigatória." },
        { status: 400 }
      );
    }

    const apiKey =
      user.openaiApiKey?.trim() || process.env.OPENAI_API_KEY?.trim();

    const client = apiKey ? new OpenAI({ apiKey }) : null;

    const classification = client
      ? await classifyIntent(client, message)
      : { intent: "CHAT" as const, confidence: 0 };

    let resultMessage = "";
    let executed = false;
    let suggestions:
      | Array<{ label: string; prompt: string }>
      | undefined;

    switch (classification.intent) {
      case "TOTAL_STUDENTS": {
        const result = await getTotalStudents();
        resultMessage = result.message;
        suggestions = result.suggestions;
        executed = !!result.executed;
        break;
      }

      case "TOTAL_ACTIVE_STUDENTS": {
        const result = await getTotalActiveStudents();
        resultMessage = result.message;
        suggestions = result.suggestions;
        executed = !!result.executed;
        break;
      }

      case "MONTHLY_REVENUE": {
        const result = await getMonthlyRevenue();
        resultMessage = result.message;
        suggestions = result.suggestions;
        executed = !!result.executed;
        break;
      }

      case "MONTHLY_FINANCIAL_SUMMARY": {
        const result = await getMonthlyFinancialSummary();
        resultMessage = result.message;
        suggestions = result.suggestions;
        executed = !!result.executed;
        break;
      }

      case "UPCOMING_EVENTS": {
        const result = await getUpcomingEvents();
        resultMessage = result.message;
        suggestions = result.suggestions;
        executed = !!result.executed;
        break;
      }

      case "LIST_OVERDUE_STUDENTS": {
        const result = await listOverdueStudents();
        resultMessage = result.message;
        suggestions = result.suggestions;
        executed = !!result.executed;
        break;
      }

      case "LIST_OVERDUE_PAYMENTS": {
        const result = await listOverduePayments();
        resultMessage = result.message;
        suggestions = result.suggestions;
        executed = !!result.executed;
        break;
      }

      case "GENERATE_MONTHLY_PAYMENTS": {
        const result = await generateMonthlyPayments(
          isConfirmationMessage(message, "confirmar geração de mensalidades")
        );
        resultMessage = result.message;
        suggestions = result.suggestions;
        executed = !!result.executed;
        break;
      }

      case "MARK_PAYMENT_PAID": {
        const params = client
          ? await extractPaymentActionParams(client, message)
          : {
              studentName: message,
              paymentMethod: "",
            };

        const result = await registerPayment({
          studentName: params.studentName,
          paymentMethod: params.paymentMethod,
          confirmed: isConfirmationMessage(message, "confirmar pagamento"),
        });

        resultMessage = result.message;
        suggestions = result.suggestions;
        executed = !!result.executed;
        break;
      }

      default: {
        if (!client) {
          resultMessage =
            "A EduIA está sem o modo avançado no momento, mas ainda posso responder consultas operacionais como alunos, pagamentos, inadimplência, eventos e receitas.";
          suggestions = [
            {
              label: "Total de alunos",
              prompt: "Quantos alunos eu tenho no sistema?",
            },
            {
              label: "Resumo financeiro",
              prompt: "Mostre um resumo financeiro do mês.",
            },
            {
              label: "Pagamentos atrasados",
              prompt: "Quais pagamentos estão atrasados?",
            },
            {
              label: "Cursos com mais alunos",
              prompt: "Quais cursos têm mais alunos?",
            },
          ];
          executed = false;
          break;
        }

        try {
          const context = await buildAiContext();
          resultMessage = await runAiFallback({
            client,
            message,
            context,
          });
          suggestions = [
            {
              label: "Total de alunos",
              prompt: "Quantos alunos eu tenho no sistema?",
            },
            {
              label: "Resumo financeiro",
              prompt: "Mostre um resumo financeiro do mês.",
            },
          ];
          executed = false;
        } catch (fallbackError) {
          console.error("Erro no fallback avançado da EduIA:", fallbackError);

          resultMessage =
            "No momento o modo avançado da EduIA está indisponível, mas posso continuar respondendo consultas operacionais do sistema.";
          suggestions = [
            {
              label: "Total de alunos",
              prompt: "Quantos alunos eu tenho no sistema?",
            },
            {
              label: "Resumo financeiro",
              prompt: "Mostre um resumo financeiro do mês.",
            },
            {
              label: "Pagamentos atrasados",
              prompt: "Quais pagamentos estão atrasados?",
            },
          ];
          executed = false;
        }
      }
    }

    await registerAiAudit({
      userId: user.id,
      message,
      intent: classification.intent,
      response: resultMessage,
      executed,
    });

    return NextResponse.json({
      message: resultMessage,
      suggestions,
      meta: {
        intent: classification.intent,
        confidence: classification.confidence,
        executed,
      },
    });
  } catch (error) {
    console.error("Erro na IA do dashboard:", error);

    return NextResponse.json(
      {
        error:
          "EduIA está temporariamente indisponível. Tente novamente em alguns instantes.",
      },
      { status: 500 }
    );
  }
}