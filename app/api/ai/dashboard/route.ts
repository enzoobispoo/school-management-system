import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";
import { registerAiAudit } from "@/lib/ai/audit";
import { classifyIntent, classifyIntentLocally } from "@/lib/ai/classifier";
import { incrementSchoolAiUsage } from "@/lib/ai/school-ai-settings";
import { resolveSchoolAiForUser, type ResolvedSchoolAi } from "@/lib/ai/resolve-school-ai";
import { normalizeConversationContext } from "@/lib/ai/conversation-context";
import { listTopCourses } from "@/lib/ai/actions/list-top-courses";
import { resolveLocalFollowUp } from "@/lib/ai/follow-up";
import { extractPaymentActionParams } from "@/lib/ai/extractor";
import { runAiWithTools } from "@/lib/ai/tool-runner";
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

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

function isConfirmationMessage(message: string, phrase: string) {
  return message.toLowerCase().includes(phrase.toLowerCase());
}

function normalizeConversationMessages(input: unknown): ConversationMessage[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const message = item as {
        role?: unknown;
        content?: unknown;
      };

      if (
        (message.role !== "user" && message.role !== "assistant") ||
        typeof message.content !== "string" ||
        !message.content.trim()
      ) {
        return null;
      }

      return {
        role: message.role,
        content: message.content.trim(),
      } satisfies ConversationMessage;
    })
    .filter((item): item is ConversationMessage => item !== null)
    .slice(-10);
}

function messageWhenOpenAiUnavailable(schoolAi: ResolvedSchoolAi | null) {
  if (!schoolAi) {
    return "Não foi possível carregar o contexto da escola para a EduIA.";
  }
  if (schoolAi.tier === "starter") {
    return "Seu plano Starter usa a EduIA integrada (sem OpenAI): posso responder com dados do sistema — alunos, pagamentos, inadimplência, eventos e receitas. Sugestões abaixo.";
  }
  if (schoolAi.limitExceeded) {
    return `O limite mensal de mensagens com IA do seu plano foi atingido (${schoolAi.usageCount}/${schoolAi.monthlyLimit}). Você ainda pode usar as consultas rápidas sugeridas abaixo.`;
  }
  return "Para usar a EduIA com OpenAI, cadastre a chave da API em Configurações → IA e integrações.";
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
    const conversationMessages = normalizeConversationMessages(body?.messages);
    const conversationContext = normalizeConversationContext(
      body?.conversationContext
    );

    if (!message) {
      return NextResponse.json(
        { error: "Mensagem obrigatória." },
        { status: 400 }
      );
    }

    const schoolAi = await resolveSchoolAiForUser(user);
    const client =
      schoolAi?.useOpenAi &&
      schoolAi.apiKey &&
      !schoolAi.limitExceeded &&
      schoolAi.monthlyLimit > 0
        ? new OpenAI({ apiKey: schoolAi.apiKey })
        : null;

    let openAiCalls = 0;
    let resultMessage = "";
    let executed = false;
    let suggestions:
      | Array<{ label: string; prompt: string }>
      | undefined;

    let nextConversationContext: Record<string, unknown> | undefined =
      conversationContext ?? undefined;

    const localFollowUp = resolveLocalFollowUp({
      message,
      conversationContext,
    });

    if (localFollowUp) {
      resultMessage = localFollowUp.message;
      suggestions = [
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
      nextConversationContext = localFollowUp.conversationContext;

      await registerAiAudit({
        userId: user.id,
        message,
        intent: "CHAT",
        response: resultMessage,
        executed,
      });

      return NextResponse.json({
        message: resultMessage,
        suggestions,
        meta: {
          intent: "CHAT",
          confidence: 1,
          executed,
          conversationContext: nextConversationContext,
        },
      });
    }

    const classification = client
      ? await (async () => {
          openAiCalls += 1;
          return classifyIntent(client, message);
        })()
      : classifyIntentLocally(message);

    switch (classification.intent) {
      case "TOTAL_STUDENTS": {
        const result = await getTotalStudents(user.schoolId);
        resultMessage = result.message;
        suggestions = result.suggestions;
        executed = !!result.executed;
        break;
      }

      case "TOTAL_ACTIVE_STUDENTS": {
        const result = await getTotalActiveStudents(user.schoolId);
        resultMessage = result.message;
        suggestions = result.suggestions;
        executed = !!result.executed;
        break;
      }

      case "MONTHLY_REVENUE": {
        const result = await getMonthlyRevenue(user.schoolId);
        resultMessage = result.message;
        suggestions = result.suggestions;
        executed = !!result.executed;
        break;
      }

      case "MONTHLY_FINANCIAL_SUMMARY": {
        const result = await getMonthlyFinancialSummary(user.schoolId);
        resultMessage = result.message;
        suggestions = result.suggestions;
        executed = !!result.executed;
        break;
      }

      case "TOP_COURSES": {
        const result = await listTopCourses(user.schoolId);
        resultMessage = result.message;
        suggestions = [
          {
            label: "Pagamentos atrasados",
            prompt: "Quais pagamentos estão atrasados?",
          },
          {
            label: "Resumo financeiro",
            prompt: "Mostre um resumo financeiro do mês.",
          },
        ];
        executed = true;
        nextConversationContext = result.conversationContext;
        break;
      }

      case "UPCOMING_EVENTS": {
        const result = await getUpcomingEvents(user.schoolId);
        resultMessage = result.message;
        suggestions = result.suggestions;
        executed = !!result.executed;
        break;
      }

      case "LIST_OVERDUE_STUDENTS": {
        const result = await listOverdueStudents(user.schoolId);
        resultMessage = result.message;
        suggestions = result.suggestions;
        executed = !!result.executed;
        break;
      }

      case "LIST_OVERDUE_PAYMENTS": {
        const result = await listOverduePayments(user.schoolId);
        resultMessage = result.message;
        suggestions = result.suggestions;
        executed = !!result.executed;
        nextConversationContext = result.conversationContext;
        break;
      }

      case "GENERATE_MONTHLY_PAYMENTS": {
        const result = await generateMonthlyPayments(
          isConfirmationMessage(message, "confirmar geração de mensalidades"),
          user.schoolId
        );
        resultMessage = result.message;
        suggestions = result.suggestions;
        executed = !!result.executed;
        break;
      }

      case "MARK_PAYMENT_PAID": {
        const params = client
          ? await (async () => {
              openAiCalls += 1;
              return extractPaymentActionParams(client, message);
            })()
          : {
              studentName: message,
              paymentMethod: "",
            };

        const result = await registerPayment({
          studentName: params.studentName,
          paymentMethod: params.paymentMethod,
          confirmed: isConfirmationMessage(message, "confirmar pagamento"),
          schoolId: user.schoolId,
        });

        resultMessage = result.message;
        suggestions = result.suggestions;
        executed = !!result.executed;
        break;
      }

      default: {
        if (!client) {
          resultMessage = messageWhenOpenAiUnavailable(schoolAi);

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
          openAiCalls += 1;
          resultMessage = await runAiWithTools({
            client,
            message,
            conversationMessages,
            schoolId: user.schoolId,
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
          console.error("Erro no modo tools da EduIA:", fallbackError);

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

    if (openAiCalls > 0 && user.schoolId) {
      await incrementSchoolAiUsage(user.schoolId, openAiCalls);
    }

    return NextResponse.json({
      message: resultMessage,
      suggestions,
      meta: {
        intent: classification.intent,
        confidence: classification.confidence,
        executed,
        conversationContext: nextConversationContext,
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