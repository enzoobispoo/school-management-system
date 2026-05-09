import OpenAI from "openai";
import type { PlanTier } from "@/lib/school-plan";
import { EDUIA_PRODUCT_CONTEXT } from "@/lib/ai/product-domain";
import type { AiToolRunAuditEntry } from "@/lib/ai/audit";
import { extractResponsesOutputText } from "@/lib/ai/responses-output-text";
import { aiDocenteToolDefinitions } from "@/lib/ai/tool-definitions-docente";
import { queryDocenteTurmas } from "@/lib/ai/tools/query-docente-turmas";
import { queryNotifications } from "@/lib/ai/tools/query-notifications";
import { createDocenteAvaliacaoTool } from "@/lib/ai/tools/create-docente-avaliacao";
import { queryDocenteAvaliacoesRecentes } from "@/lib/ai/tools/query-docente-avaliacoes-recentes";
import { queryDocenteDiarioRecente } from "@/lib/ai/tools/query-docente-diario-recente";
import { createDocenteApresentacaoTool } from "@/lib/ai/tools/create-docente-apresentacao";
import type { AuthenticatedUser } from "@/lib/auth/get-current-user";

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

type DocenteToolName =
  | "query_docente_turmas"
  | "query_notifications"
  | "create_docente_avaliacao"
  | "create_docente_apresentacao"
  | "query_docente_avaliacoes_recentes"
  | "query_docente_diario_recente";

export type DocenteToolRunContext = {
  schoolId?: string | null;
  userId?: string | null;
  professorId?: string | null;
  planTier?: PlanTier;
  user: AuthenticatedUser | null;
};

async function runDocenteTool(
  name: DocenteToolName,
  rawArgs: string,
  ctx: DocenteToolRunContext
) {
  let args: Record<string, unknown> = {};
  try {
    const parsed: unknown = rawArgs ? JSON.parse(rawArgs) : {};
    args =
      typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
  } catch {
    args = {};
  }

  switch (name) {
    case "query_docente_turmas":
      return queryDocenteTurmas(
        args as Parameters<typeof queryDocenteTurmas>[0],
        ctx.schoolId,
        ctx.professorId
      );
    case "query_notifications": {
      const uid = ctx.user?.id ?? ctx.userId ?? "";
      if (!uid) {
        return {
          error: "user_missing",
          naoLidas: 0,
          itens: [],
        };
      }
      return queryNotifications(
        args as Parameters<typeof queryNotifications>[0],
        ctx.schoolId,
        ctx.user?.role === "PROFESSOR" ?
          {
            role: "PROFESSOR",
            professorId: ctx.professorId ?? ctx.user?.professorId ?? null,
            userId: uid,
          }
        : {
            role: ctx.user?.role ?? "ADMIN",
            professorId: null,
            userId: uid,
          }
      );
    }
    case "create_docente_avaliacao":
      return createDocenteAvaliacaoTool(args, {
        schoolId: ctx.schoolId,
        user: ctx.user,
      });
    case "create_docente_apresentacao":
      return createDocenteApresentacaoTool(args, {
        schoolId: ctx.schoolId,
        user: ctx.user,
      });
    case "query_docente_avaliacoes_recentes":
      return queryDocenteAvaliacoesRecentes(
        args as Parameters<typeof queryDocenteAvaliacoesRecentes>[0],
        ctx.schoolId,
        ctx.professorId
      );
    case "query_docente_diario_recente":
      return queryDocenteDiarioRecente(
        args as Parameters<typeof queryDocenteDiarioRecente>[0],
        ctx.schoolId,
        ctx.professorId
      );
    default:
      throw new Error(`Tool docente não suportada: ${name}`);
  }
}

export async function runAiWithDocenteTools(params: {
  client: OpenAI;
  message: string;
  conversationMessages?: ConversationMessage[];
  schoolId?: string | null;
  userId?: string | null;
  professorId?: string | null;
  planTier?: PlanTier;
  operatorBriefing?: string | null;
  user: AuthenticatedUser | null;
}): Promise<{ message: string; toolRuns: AiToolRunAuditEntry[] }> {
  const toolRuns: AiToolRunAuditEntry[] = [];
  const toolCtx: DocenteToolRunContext = {
    schoolId: params.schoolId,
    userId: params.userId,
    professorId: params.professorId,
    planTier: params.planTier,
    user: params.user,
  };

  const historyText =
    params.conversationMessages && params.conversationMessages.length > 0
      ? params.conversationMessages
          .map(
            (message) =>
              `${message.role === "user" ? "Professor" : "Assistente"}: ${
                message.content
              }`
          )
          .join("\n")
      : "Sem histórico anterior.";

  const briefingBlock =
    params.operatorBriefing?.trim() ?
      `
Contexto da sessão:
${params.operatorBriefing.trim()}
`
    : "";

  let response = await params.client.responses.create({
    model: "gpt-5.4-mini",
    input: [
      {
        role: "system",
        content: `
Você é a EduIA no modo professor — copiloto pedagógico do workspace docente (turmas em que é titular, avisos e avaliações).
${EDUIA_PRODUCT_CONTEXT}
${briefingBlock}
Regras:
- Responda em português do Brasil, tom profissional e direto.
- No texto que o professor lê, jamais cite nomes internos de ferramentas (palavras com sublinhado tipo query_* ou create_*), nem JSON técnico, slideSpecs ou confirmed:true/false — diga em linguagem natural (“vou conferir suas turmas no cadastro”, “segue o rascunho dos slides”).
- Não acesse nem mencione dados financeiros globais da escola, faturamento ou cobranças de outros perfis.
- Para dados de turmas e disciplinas do professor, use sempre query_docente_turmas antes de afirmar nomes de turmas ou ids.
- Para avisos da escola, use query_notifications quando precisar de fatos recentes.
- Para listar provas já criadas, use query_docente_avaliacoes_recentes antes de sugerir duplicatas ou revisões.
- Para sugestões de sequência didática, revisão ou próximos temas, use query_docente_diario_recente quando precisar de fatos sobre aulas já registradas.
- Você pode propor planos de aula, ideias de atividades, rubricas de correção e pegadinhas comuns em avaliações — sempre alinhado ao BNCC apenas quando o professor pedir explicitamente.
- Para criar avaliações/provas via ferramenta create_docente_avaliacao: primeiro monte o pedido com dados claros (turma, disciplina, título, data); na primeira chamada use confirmed:false e mostre o preview; só use confirmed:true depois que o professor confirmar explicitamente (por exemplo dizendo que confirma usando a frase sugerida pela tool).
- Para criar apresentações (slides editáveis no estilo Canva simplificado) use create_docente_apresentacao com slideSpecs (lista de slides com title; use boldVisualLayout:true na primeira página para capa “hero” vibrante; bullets com linhas separadas por \\n). Mesmo fluxo confirmed:false depois confirmed:true. Opcionalmente turmaId/disciplinaId para vincular o material.
- Geração de ilustrações 3D ou imagens automáticas não está ligada por padrão — use texto, cores (#hex) e oriente upload de imagens no editor. Chaves opcionais Gemini / Anthropic / Fal ficam nas configurações da escola para evoluções futuras.
- Oriente sobre telas: /docente (painel), /docente/avaliacoes/nova (formulário), /docente/avaliacoes (biblioteca), /docente/avaliacoes/[id]/ver (visualizar), /docente/avaliacoes/[id]/quadro (quadro para correção/apresentação), /docente/materiais/apresentacoes (biblioteca de slides), /docente/materiais/apresentacoes/editor/[id] (editor), /mensagens, /docente/eduia (workspace IA).
- Se faltar informação (qual turma ou disciplina), liste opções vindas de query_docente_turmas e peça uma escolha objetiva.
`,
      },
      {
        role: "user",
        content: `Histórico recente:
${historyText}

Pergunta atual:
${params.message}`,
      },
    ],
    tools: aiDocenteToolDefinitions as unknown as OpenAI.Responses.Tool[],
    store: false,
  });

  for (let step = 0; step < 5; step += 1) {
    const functionCalls = (response.output || []).filter(
      (item): item is OpenAI.Responses.ResponseFunctionToolCall =>
        item.type === "function_call"
    );

    if (functionCalls.length === 0) {
      const text = extractResponsesOutputText(response);
      return {
        message:
          text ||
          "Não foi possível gerar uma resposta no momento.",
        toolRuns,
      };
    }

    const toolOutputs = await Promise.all(
      functionCalls.map(async (call) => {
        const started = Date.now();
        try {
          const output = await runDocenteTool(
            call.name as DocenteToolName,
            call.arguments || "{}",
            toolCtx
          );
          toolRuns.push({
            tool: call.name,
            durationMs: Date.now() - started,
          });
          return {
            type: "function_call_output" as const,
            call_id: call.call_id,
            output: JSON.stringify(output),
          };
        } catch (error) {
          const errMsg =
            error instanceof Error ? error.message : String(error);
          toolRuns.push({
            tool: call.name,
            durationMs: Date.now() - started,
            error: errMsg,
          });
          return {
            type: "function_call_output" as const,
            call_id: call.call_id,
            output: JSON.stringify({
              tool_error: true,
              tool: call.name,
              message: errMsg,
              hint:
                "Informe o professor de forma breve e sugira repetir o pedido ou verificar dados (turma/disciplina).",
            }),
          };
        }
      })
    );

    response = await params.client.responses.create({
      model: "gpt-5.4-mini",
      previous_response_id: response.id,
      input: toolOutputs,
      tools: aiDocenteToolDefinitions as unknown as OpenAI.Responses.Tool[],
      store: false,
    });
  }

  const finalText = extractResponsesOutputText(response);
  return {
    message:
      finalText ||
      "Não foi possível gerar uma resposta no momento.",
    toolRuns,
  };
}
