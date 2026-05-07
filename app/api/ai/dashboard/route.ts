import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { canAccessExecutiveEduia, getCurrentUser } from "@/lib/auth";
import {
  registerAiAudit,
  type AiToolRunAuditEntry,
} from "@/lib/ai/audit";
import {
  readCorrelationIdFromRequest,
  withCorrelationHeader,
} from "@/lib/observability/correlation";
import { aiDashboardPostSchema } from "@/lib/validations/ai-dashboard";
import { classifyIntent, classifyIntentLocally } from "@/lib/ai/classifier";
import { incrementSchoolAiUsage } from "@/lib/ai/school-ai-settings";
import { resolveSchoolAiForUser, type ResolvedSchoolAi } from "@/lib/ai/resolve-school-ai";
import { normalizeConversationContext } from "@/lib/ai/conversation-context";
import { listTopCourses } from "@/lib/ai/actions/list-top-courses";
import { resolveLocalFollowUp } from "@/lib/ai/follow-up";
import { extractPaymentActionParams } from "@/lib/ai/extractor";
import { runAiWithTools } from "@/lib/ai/tool-runner";
import { buildEduiaOperatorBriefing } from "@/lib/ai/operator-briefing";
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
  getTotalActiveEnrollments,
  getTotalOverduePaymentsSummary,
  getTotalPendingPaymentsSummary,
} from "@/lib/ai/actions";
import { getEduiaQuickSuggestions } from "@/lib/ai/suggestions";

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
  const prefix = schoolAi.schoolDisplayName
    ? `${schoolAi.schoolDisplayName} — `
    : "";
  if (schoolAi.tier === "starter") {
    return `${prefix}no plano Starter a EduIA roda em modo integrado (sem OpenAI): consultas rápidas com dados reais — alunos, pagamentos, inadimplência, eventos e receitas. Use as sugestões abaixo ou pergunte de forma direta.`;
  }
  if (schoolAi.limitExceeded) {
    return `O limite mensal de mensagens com IA do seu plano foi atingido (${schoolAi.usageCount}/${schoolAi.monthlyLimit}). Você ainda pode usar as consultas rápidas sugeridas abaixo.`;
  }
  return "Para usar a EduIA com OpenAI, cadastre a chave da API em Configurações → IA e integrações.";
}

export async function POST(request: NextRequest) {
  const correlationId = readCorrelationIdFromRequest(request);
  const json = (body: Record<string, unknown>, init?: ResponseInit) =>
    withCorrelationHeader(NextResponse.json(body, init), correlationId);

  try {
    const user = await getCurrentUser();

    if (!user) {
      return json({ error: "Não autenticado." }, { status: 401 });
    }

    if (!canAccessExecutiveEduia(user)) {
      return withCorrelationHeader(
        NextResponse.json(
          {
            error:
              "A EduIA deste painel usa dados de gestão da escola e não está disponível para o perfil Professor.",
            code: "EDUIA_ROLE_RESTRICTED",
          },
          { status: 403 }
        ),
        correlationId
      );
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return json({ error: "Corpo da requisição inválido." }, { status: 400 });
    }

    const parsed = aiDashboardPostSchema.safeParse(raw);
    if (!parsed.success) {
      return json(
        {
          error: "Dados inválidos.",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const message = parsed.data.message.trim();
    const conversationMessages = normalizeConversationMessages(
      parsed.data.messages
    );
    const conversationContext = normalizeConversationContext(
      parsed.data.conversationContext
    );

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

    let toolRunsForAudit: AiToolRunAuditEntry[] | undefined;
    let toolsUsedMeta: string[] | undefined;

    const localFollowUp = resolveLocalFollowUp({
      message,
      conversationContext,
    });

    if (localFollowUp) {
      resultMessage = localFollowUp.message;
      suggestions = getEduiaQuickSuggestions().slice(0, 8);
      executed = false;
      nextConversationContext = localFollowUp.conversationContext;
      toolsUsedMeta = [];

      await registerAiAudit({
        userId: user.id,
        schoolId: user.schoolId,
        correlationId,
        message,
        intent: "CHAT",
        response: resultMessage,
        executed,
      });

      return json({
        message: resultMessage,
        suggestions,
        meta: {
          intent: "CHAT",
          confidence: 1,
          executed,
          conversationContext: nextConversationContext,
          correlationId,
          toolsUsed: toolsUsedMeta,
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

      case "TOTAL_ACTIVE_ENROLLMENTS": {
        const result = await getTotalActiveEnrollments(user.schoolId);
        resultMessage = result.message;
        suggestions = result.suggestions;
        executed = !!result.executed;
        break;
      }

      case "TOTAL_OVERDUE_PAYMENTS": {
        const result = await getTotalOverduePaymentsSummary(user.schoolId);
        resultMessage = result.message;
        suggestions = result.suggestions;
        executed = !!result.executed;
        break;
      }

      case "TOTAL_PENDING_PAYMENTS": {
        const result = await getTotalPendingPaymentsSummary(user.schoolId);
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

          suggestions = getEduiaQuickSuggestions();
          executed = false;
          toolsUsedMeta = [`consulta:${classification.intent}`];
          break;
        }

        try {
          openAiCalls += 1;
          const operatorBriefing =
            schoolAi && user.schoolId
              ? buildEduiaOperatorBriefing({
                  schoolDisplayName: schoolAi.schoolDisplayName,
                  operatorFullName: user.nome,
                  planTier: schoolAi.tier,
                  aiUsageCount: schoolAi.usageCount,
                  aiMonthlyLimit: schoolAi.monthlyLimit,
                })
              : null;

          const aiRun = await runAiWithTools({
            client,
            message,
            conversationMessages,
            schoolId: user.schoolId,
            userId: user.id,
            role: user.role,
            professorId: user.professorId ?? null,
            planTier: schoolAi?.tier,
            operatorBriefing,
          });
          resultMessage = aiRun.message;
          toolRunsForAudit =
            aiRun.toolRuns.length > 0 ? aiRun.toolRuns : undefined;
          toolsUsedMeta =
            aiRun.toolRuns.length > 0
              ? [...new Set(aiRun.toolRuns.map((r) => r.tool))]
              : ["openai_sem_tools"];
          suggestions = getEduiaQuickSuggestions();
          executed = false;
        } catch (fallbackError) {
          console.error("Erro no modo tools da EduIA:", fallbackError);

          resultMessage =
            "No momento o modo avançado da EduIA está indisponível, mas posso continuar respondendo consultas operacionais do sistema.";
          suggestions = getEduiaQuickSuggestions();
          executed = false;
          toolsUsedMeta = ["openai_tools_erro"];
        }
      }
    }

    if (toolsUsedMeta === undefined) {
      toolsUsedMeta = [`consulta:${classification.intent}`];
    }

    await registerAiAudit({
      userId: user.id,
      schoolId: user.schoolId,
      correlationId,
      message,
      intent: classification.intent,
      response: resultMessage,
      executed,
      toolRuns: toolRunsForAudit,
    });

    if (openAiCalls > 0 && user.schoolId) {
      await incrementSchoolAiUsage(user.schoolId, openAiCalls);
    }

    return json({
      message: resultMessage,
      suggestions,
      meta: {
        intent: classification.intent,
        confidence: classification.confidence,
        executed,
        conversationContext: nextConversationContext,
        correlationId,
        toolsUsed: toolsUsedMeta,
      },
    });
  } catch (error) {
    console.error("Erro na IA do dashboard:", error);

    return json(
      {
        error:
          "EduIA está temporariamente indisponível. Tente novamente em alguns instantes.",
      },
      { status: 500 }
    );
  }
}