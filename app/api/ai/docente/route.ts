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
import type { AuthenticatedUser } from "@/lib/auth";
import {
  filterAndPublicAiSuggestions,
  eduiaClientCapsFromResolvedSchoolAi,
} from "@/lib/ai/eduia-client-caps";
import { getEduiaDocenteQuickSuggestions } from "@/lib/ai/suggestions";
import { blockProfessorWhenPortalDisabled } from "@/lib/docente/professor-portal-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function docenteAiScope(user: AuthenticatedUser): NextResponse | {
  schoolId: string;
  professorId: string | null;
  needsProfessorLink: boolean;
} {
  if (user.role !== "PROFESSOR") {
    return NextResponse.json(
      { error: "Acesso restrito a professores." },
      { status: 403 }
    );
  }
  const sid = user.schoolId?.trim();
  if (!sid) {
    return NextResponse.json(
      { error: "Escola não associada ao usuário." },
      { status: 403 }
    );
  }
  const pid = user.professorId?.trim() ?? null;
  return {
    schoolId: sid,
    professorId: pid,
    needsProfessorLink: !pid,
  };
}

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
    return `${prefix}no plano **Starter** a EduIA do professor fica em **modo integrado** (sem modelo OpenAI): você vê abaixo dados reais das suas turmas titulares e pode usar as **Sugestões rápidas** para perguntas objetivas. Para respostas generativas com ferramentas (pré-visualização de provas, slides, etc.), a escola precisa de plano com uso de IA e **chave OpenAI** em Configurações → IA e integrações.`;
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

    const portalDenied = await blockProfessorWhenPortalDisabled(user);
    if (portalDenied) {
      return withCorrelationHeader(portalDenied, correlationId);
    }

    const scope = docenteAiScope(user);
    if (scope instanceof NextResponse) {
      return withCorrelationHeader(scope, correlationId);
    }

    const { schoolId, professorId, needsProfessorLink } = scope;

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
    const eduiaCaps = eduiaClientCapsFromResolvedSchoolAi(schoolAi);
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

    if (needsProfessorLink) {
      const linkMsg =
        "Sua conta ainda **não está vinculada** ao cadastro de professor nesta escola (mesmo e-mail na ficha). Isso não é um erro seu: quando a secretaria ajustar, as turmas aparecem aqui automaticamente.\n\n" +
        "Enquanto isso você pode usar **Nova avaliação**, **Mensagens**, **Materiais** e **Calendário** pelo menu. As sugestões abaixo trazem orientações gerais que funcionam sem dados de turma.\n\n" +
        "### Suas turmas (titular)\n" +
        formatTurmasDocenteMarkdown(turmasSnapshot);

      await registerAiAudit({
        userId: user.id,
        schoolId,
        correlationId,
        message,
        intent: "DOCENTE_NEEDS_LINK",
        response: linkMsg,
        executed: false,
      });

      return json({
        message: linkMsg,
        suggestions: filterAndPublicAiSuggestions(
          getEduiaDocenteQuickSuggestions(),
          eduiaCaps
        ),
        meta: {
          intent: "DOCENTE_NEEDS_LINK",
          confidence: 1,
          executed: false,
          conversationContext: nextConversationContext,
          correlationId,
          toolsUsed: ["docente_sem_vinculo"],
        },
      });
    }

    if (!client) {
      resultMessage = `${messageWhenOpenAiUnavailableDocente(schoolAi)}

### Suas turmas (titular)
${formatTurmasDocenteMarkdown(turmasSnapshot)}`;
      suggestions = filterAndPublicAiSuggestions(
        getEduiaDocenteQuickSuggestions(),
        eduiaCaps
      );
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
      suggestions = filterAndPublicAiSuggestions(
        getEduiaDocenteQuickSuggestions(),
        eduiaCaps
      );
    } catch (fallbackError) {
      console.error("Erro no modo tools da EduIA (docente):", fallbackError);

      resultMessage =
        "Encontrei um erro técnico ao processar esta mensagem com as ferramentas da EduIA. **Seus dados de turmas como titular** continuam disponíveis abaixo — use também os botões em **Sugestões rápidas**.\n\n" +
        "### Turmas (titular)\n" +
        formatTurmasDocenteMarkdown(turmasSnapshot);
      suggestions = filterAndPublicAiSuggestions(
        getEduiaDocenteQuickSuggestions(),
        eduiaCaps
      );
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
