import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";
import {
  registerAiAudit,
  type AiToolRunAuditEntry,
} from "@/lib/ai/audit";
import {
  readCorrelationIdFromRequest,
  withCorrelationHeader,
} from "@/lib/observability/correlation";
import { aiDashboardPostSchema } from "@/lib/validations/ai-dashboard";
import { incrementSchoolAiUsage } from "@/lib/ai/school-ai-settings";
import { resolveSchoolAiForUser, type ResolvedSchoolAi } from "@/lib/ai/resolve-school-ai";
import { normalizeConversationContext } from "@/lib/ai/conversation-context";
import { buildEduiaOperatorBriefing } from "@/lib/ai/operator-briefing";
import { runAiWithDocenteTools } from "@/lib/ai/tool-runner-docente";
import {
  queryDocenteTurmas,
  type QueryDocenteTurmasResult,
} from "@/lib/ai/tools/query-docente-turmas";
import { requireProfessorContext } from "@/lib/docente/require-professor";
import { getEduiaDocenteQuickSuggestions } from "@/lib/ai/suggestions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

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

function messageWhenOpenAiUnavailableDocente(schoolAi: ResolvedSchoolAi | null) {
  if (!schoolAi) {
    return "Não foi possível carregar o contexto da escola para a EduIA.";
  }
  const prefix = schoolAi.schoolDisplayName
    ? `${schoolAi.schoolDisplayName} — `
    : "";
  if (schoolAi.tier === "starter") {
    return `${prefix}no plano Starter a EduIA do professor está em modo integrado (sem OpenAI): você recebe seus dados de turmas abaixo. Para sugestões de avaliações com IA generativa, a escola precisa de plano com OpenAI configurado em Configurações → IA e integrações.`;
  }
  if (schoolAi.limitExceeded) {
    return `O limite mensal de mensagens com IA do seu plano foi atingido (${schoolAi.usageCount}/${schoolAi.monthlyLimit}). Abaixo estão suas turmas no sistema; use /docente/avaliacoes/nova para criar avaliações manualmente.`;
  }
  return "Para usar a EduIA com OpenAI no workspace docente, cadastre a chave da API em Configurações → IA e integrações.";
}

function formatTurmasDocenteMarkdown(data: QueryDocenteTurmasResult) {
  if (!data.turmas.length) {
    return "_Nenhuma turma ativa encontrada em seu nome como titular._";
  }
  return data.turmas
    .map((t) => {
      const disc =
        t.disciplinas.length ?
          t.disciplinas.map((d) => d.nome).join(", ")
        : "—";
      return `- **${t.nome}** (${t.curso}) — ${t.matriculasAtivas} alunos ativos; disciplinas: ${disc}`;
    })
    .join("\n");
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

    const pctx = requireProfessorContext(user);
    if (pctx instanceof NextResponse) {
      return withCorrelationHeader(pctx, correlationId);
    }

    const { schoolId, professorId } = pctx;

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
    let suggestions:
      | Array<{ label: string; prompt: string }>
      | undefined;
    let nextConversationContext: Record<string, unknown> | undefined =
      conversationContext ?? undefined;
    let toolRunsForAudit: AiToolRunAuditEntry[] | undefined;
    let toolsUsedMeta: string[] | undefined;

    const turmasSnapshot = await queryDocenteTurmas(
      { limit: 24 },
      schoolId,
      professorId
    );

    if (!client) {
      resultMessage = `${messageWhenOpenAiUnavailableDocente(schoolAi)}

### Suas turmas (titular)
${formatTurmasDocenteMarkdown(turmasSnapshot)}`;
      suggestions = getEduiaDocenteQuickSuggestions();
      toolsUsedMeta = ["docente_modo_integrado"];

      await registerAiAudit({
        userId: user.id,
        schoolId,
        correlationId,
        message,
        intent: "DOCENTE_STARTER",
        response: resultMessage,
        executed: false,
      });

      return json({
        message: resultMessage,
        suggestions,
        meta: {
          intent: "DOCENTE_STARTER",
          confidence: 1,
          executed: false,
          conversationContext: nextConversationContext,
          correlationId,
          toolsUsed: toolsUsedMeta,
        },
      });
    }

    try {
      openAiCalls += 1;
      const operatorBriefing =
        schoolAi && schoolId ?
          buildEduiaOperatorBriefing({
            schoolDisplayName: schoolAi.schoolDisplayName,
            operatorFullName: user.nome,
            planTier: schoolAi.tier,
            aiUsageCount: schoolAi.usageCount,
            aiMonthlyLimit: schoolAi.monthlyLimit,
          })
        : null;

      const aiRun = await runAiWithDocenteTools({
        client,
        message,
        conversationMessages,
        schoolId,
        userId: user.id,
        professorId,
        planTier: schoolAi?.tier,
        operatorBriefing,
        user,
      });
      resultMessage = aiRun.message;
      toolRunsForAudit =
        aiRun.toolRuns.length > 0 ? aiRun.toolRuns : undefined;
      toolsUsedMeta =
        aiRun.toolRuns.length > 0
          ? [...new Set(aiRun.toolRuns.map((r) => r.tool))]
          : ["openai_docente_sem_tools"];
      suggestions = getEduiaDocenteQuickSuggestions();
    } catch (fallbackError) {
      console.error("Erro no modo tools da EduIA (docente):", fallbackError);

      resultMessage =
        "No momento o modo avançado da EduIA está indisponível. Seguem suas turmas cadastrais:\n\n" +
        formatTurmasDocenteMarkdown(turmasSnapshot);
      suggestions = getEduiaDocenteQuickSuggestions();
      toolsUsedMeta = ["docente_tools_erro"];
    }

    await registerAiAudit({
      userId: user.id,
      schoolId,
      correlationId,
      message,
      intent: "DOCENTE_TOOLS",
      response: resultMessage,
      executed: false,
      toolRuns: toolRunsForAudit,
    });

    if (openAiCalls > 0 && schoolId) {
      await incrementSchoolAiUsage(schoolId, openAiCalls);
    }

    return json({
      message: resultMessage,
      suggestions,
      meta: {
        intent: "DOCENTE_TOOLS",
        confidence: 1,
        executed: false,
        conversationContext: nextConversationContext,
        correlationId,
        toolsUsed: toolsUsedMeta ?? [],
      },
    });
  } catch (error) {
    console.error("Erro na EduIA docente:", error);

    return json(
      {
        error:
          "EduIA está temporariamente indisponível. Tente novamente em alguns instantes.",
      },
      { status: 500 }
    );
  }
}
