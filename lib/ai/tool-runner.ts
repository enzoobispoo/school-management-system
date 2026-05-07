import OpenAI from "openai";
import type { PlanTier } from "@/lib/school-plan";
import { aiToolDefinitions } from "@/lib/ai/tool-definitions";
import { queryStudents } from "@/lib/ai/tools/query-students";
import { queryCourses } from "@/lib/ai/tools/query-courses";
import { queryTeachers } from "@/lib/ai/tools/query-teachers";
import { queryPayments } from "@/lib/ai/tools/query-payments";
import { queryDashboard } from "@/lib/ai/tools/query-dashboard";
import { registerPaymentTool } from "@/lib/ai/tools/register-payment";
import { generateMonthlyPaymentsTool } from "@/lib/ai/tools/generate-monthly-payments";
import { queryClasses } from "@/lib/ai/tools/query-classes";
import { queryOperationalIncidents } from "@/lib/ai/tools/query-operational-incidents";
import { queryNotifications } from "@/lib/ai/tools/query-notifications";
import { queryAcademicOverview } from "@/lib/ai/tools/query-academic-overview";
import { manageOperationalIncidentTool } from "@/lib/ai/tools/manage-operational-incident";
import { runOperationalEvaluationTool } from "@/lib/ai/tools/run-operational-evaluation";
import { queryStudentReport } from "@/lib/ai/tools/query-student-report";
import { markNotificationReadTool } from "@/lib/ai/tools/mark-notification-read";
import { createStudentTool } from "@/lib/ai/tools/create-student";
import { createCourseTool } from "@/lib/ai/tools/create-course";
import { createProfessorTool } from "@/lib/ai/tools/create-professor";
import { createClassTool } from "@/lib/ai/tools/create-class";
import { createEnrollmentTool } from "@/lib/ai/tools/create-enrollment";
import { EDUIA_PRODUCT_CONTEXT } from "@/lib/ai/product-domain";
import type { AiToolRunAuditEntry } from "@/lib/ai/audit";

export type AiToolRunContext = {
  schoolId?: string | null;
  userId?: string | null;
  role?: string | null;
  professorId?: string | null;
  planTier?: PlanTier;
};

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

type ToolName =
  | "query_students"
  | "query_courses"
  | "query_teachers"
  | "query_payments"
  | "query_dashboard"
  | "query_classes"
  | "query_operational_incidents"
  | "query_notifications"
  | "mark_notification_read"
  | "query_student_report"
  | "query_academic_overview"
  | "manage_operational_incident"
  | "run_operational_evaluation"
  | "register_payment"
  | "generate_monthly_payments"
  | "create_student"
  | "create_course"
  | "create_professor"
  | "create_class"
  | "create_enrollment";

async function runTool(name: ToolName, rawArgs: string, ctx: AiToolRunContext) {
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
    case "query_students":
      return queryStudents(args as Parameters<typeof queryStudents>[0], ctx.schoolId);
    case "query_courses":
      return queryCourses(args as Parameters<typeof queryCourses>[0], ctx.schoolId);
    case "query_teachers":
      return queryTeachers(args as Parameters<typeof queryTeachers>[0], ctx.schoolId);
    case "query_payments":
      return queryPayments(args as Parameters<typeof queryPayments>[0], ctx.schoolId);
    case "query_dashboard":
      return queryDashboard(ctx.schoolId);
    case "query_classes":
      return queryClasses(args as Parameters<typeof queryClasses>[0], ctx.schoolId);
    case "query_operational_incidents":
      return queryOperationalIncidents(
        args as Parameters<typeof queryOperationalIncidents>[0],
        ctx.schoolId
      );
    case "query_notifications":
      return queryNotifications(
        args as Parameters<typeof queryNotifications>[0],
        ctx.schoolId,
        ctx.userId ?
          {
            role: ctx.role ?? "ADMIN",
            professorId: ctx.professorId ?? null,
            userId: ctx.userId,
          }
        : undefined
      );
    case "mark_notification_read":
      return markNotificationReadTool(
        args as Parameters<typeof markNotificationReadTool>[0],
        ctx.schoolId
      );
    case "query_student_report":
      return queryStudentReport(args as Parameters<typeof queryStudentReport>[0], ctx.schoolId);
    case "query_academic_overview":
      return queryAcademicOverview(ctx.schoolId);
    case "manage_operational_incident":
      return manageOperationalIncidentTool(
        args as Parameters<typeof manageOperationalIncidentTool>[0],
        ctx.schoolId,
        ctx.userId
      );
    case "run_operational_evaluation":
      return runOperationalEvaluationTool(
        args as Parameters<typeof runOperationalEvaluationTool>[0],
        ctx.schoolId,
        ctx.planTier
      );
    case "register_payment":
      return registerPaymentTool(args as Parameters<typeof registerPaymentTool>[0], ctx.schoolId);
    case "generate_monthly_payments":
      return generateMonthlyPaymentsTool(
        args as Parameters<typeof generateMonthlyPaymentsTool>[0],
        ctx.schoolId
      );
    case "create_student":
      return createStudentTool(args as Parameters<typeof createStudentTool>[0], ctx.schoolId);
    case "create_course":
      return createCourseTool(args as Parameters<typeof createCourseTool>[0], ctx.schoolId);
    case "create_professor":
      return createProfessorTool(args as Parameters<typeof createProfessorTool>[0], ctx.schoolId);
    case "create_class":
      return createClassTool(args as Parameters<typeof createClassTool>[0], ctx.schoolId);
    case "create_enrollment":
      return createEnrollmentTool(args as Parameters<typeof createEnrollmentTool>[0], ctx.schoolId);
    default:
      throw new Error(`Tool não suportada: ${name}`);
  }
}

export async function runAiWithTools(params: {
  client: OpenAI;
  message: string;
  conversationMessages?: ConversationMessage[];
  schoolId?: string | null;
  userId?: string | null;
  role?: string | null;
  professorId?: string | null;
  planTier?: PlanTier;
  /** Linha única com escola, operador, plano e horário — fortalece o modo copiloto. */
  operatorBriefing?: string | null;
}): Promise<{ message: string; toolRuns: AiToolRunAuditEntry[] }> {
  const toolRuns: AiToolRunAuditEntry[] = [];
  const toolCtx: AiToolRunContext = {
    schoolId: params.schoolId,
    userId: params.userId,
    role: params.role ?? null,
    professorId: params.professorId ?? null,
    planTier: params.planTier,
  };
  const historyText =
    params.conversationMessages && params.conversationMessages.length > 0
      ? params.conversationMessages
          .map(
            (message) =>
              `${message.role === "user" ? "Usuário" : "Assistente"}: ${
                message.content
              }`
          )
          .join("\n")
      : "Sem histórico anterior.";

  const briefingBlock =
    params.operatorBriefing?.trim() ?
      `
Contexto da sessão (uso interno; você pode cumprimentar pelo primeiro nome se couber naturalmente):
${params.operatorBriefing.trim()}
`
    : "";

  let response = await params.client.responses.create({
    model: "gpt-5.4-mini",
    input: [
      {
        role: "system",
        content: `
Você é a EduIA — copiloto escolar da equipe de gestão: antecipa necessidades, cruza dados e orienta ação na plataforma (sem inventar fatos).
${EDUIA_PRODUCT_CONTEXT}
${briefingBlock}
Regras:
- Responda em português do Brasil, com clareza para gestão escolar (direção, financeiro, secretaria).
- Para qualquer dado da escola (números, nomes, listas, turmas, incidentes, pagamentos), chame as tools adequadas. Não invente valores.
- Combine várias tools se a pergunta cruzar domínios (ex.: financeiro + turmas).
- Para perguntas como pulse ou “o que fazer”: comece por query_dashboard (receita vs mês anterior, ocupação de turmas, atrasos) e complemente com query_classes, query_courses ou query_payments quando precisar; então sugira ações priorizadas e realizáveis na plataforma, sempre citando os números obtidos.
- Explique ao usuário onde agir na interface quando fizer sentido (rotas entre parênteses, ex.: /financeiro).
- Ações que alteram dados (pagamentos, mensalidades, cadastros de aluno/professor/curso/turma, matrícula, incidentes operacionais, avaliação operacional): sempre duas etapas quando a tool retornar needsConfirmation — primeiro explica e pede confirmação; só na segunda chamada use confirmed:true depois do usuário aceitar claramente.
- Nunca use confirmed:true por conta própria sem concordância explícita do usuário.
- Dispensa de incidentes operacionais continua restrita a administradores na interface; não tente dispensar pela IA.
- Disparar avaliação operacional automatizada (tool run_operational_evaluation) só está habilitado para escolas no plano Full; nos demais planos, indique /operacao manualmente.
- Se faltar escopo na pergunta, faça uma inferência razoável ou peça um critério objetivo (nome aproximado, período, turma).
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
    tools: aiToolDefinitions as unknown as OpenAI.Responses.Tool[],
    store: false,
  });

  for (let step = 0; step < 5; step += 1) {
    const functionCalls = (response.output || []).filter(
      (item): item is OpenAI.Responses.ResponseFunctionToolCall =>
        item.type === "function_call"
    );

    if (functionCalls.length === 0) {
      return {
        message:
          response.output_text?.trim() ||
          "Não foi possível gerar uma resposta no momento.",
        toolRuns,
      };
    }

    const toolOutputs = await Promise.all(
      functionCalls.map(async (call) => {
        const started = Date.now();
        try {
          const output = await runTool(
            call.name as ToolName,
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
          toolRuns.push({
            tool: call.name,
            durationMs: Date.now() - started,
            error:
              error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      })
    );

    response = await params.client.responses.create({
      model: "gpt-5.4-mini",
      previous_response_id: response.id,
      input: toolOutputs,
      tools: aiToolDefinitions as unknown as OpenAI.Responses.Tool[],
      store: false,
    });
  }

  return {
    message:
      response.output_text?.trim() ||
      "Não foi possível gerar uma resposta no momento.",
    toolRuns,
  };
}