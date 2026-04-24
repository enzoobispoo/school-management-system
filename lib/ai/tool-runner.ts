import OpenAI from "openai";
import { aiToolDefinitions } from "@/lib/ai/tool-definitions";
import { queryStudents } from "@/lib/ai/tools/query-students";
import { queryCourses } from "@/lib/ai/tools/query-courses";
import { queryTeachers } from "@/lib/ai/tools/query-teachers";
import { queryPayments } from "@/lib/ai/tools/query-payments";
import { queryDashboard } from "@/lib/ai/tools/query-dashboard";
import { registerPaymentTool } from "@/lib/ai/tools/register-payment";
import { generateMonthlyPaymentsTool } from "@/lib/ai/tools/generate-monthly-payments";

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
  | "register_payment"
  | "generate_monthly_payments";

async function runTool(name: ToolName, rawArgs: string) {
  const args = rawArgs ? JSON.parse(rawArgs) : {};

  switch (name) {
    case "query_students":
      return queryStudents(args);
    case "query_courses":
      return queryCourses(args);
    case "query_teachers":
      return queryTeachers(args);
    case "query_payments":
      return queryPayments(args);
    case "query_dashboard":
      return queryDashboard();
    case "register_payment":
      return registerPaymentTool(args);
    case "generate_monthly_payments":
      return generateMonthlyPaymentsTool(args);
    default:
      throw new Error(`Tool não suportada: ${name}`);
  }
}

export async function runAiWithTools(params: {
  client: OpenAI;
  message: string;
  conversationMessages?: ConversationMessage[];
}) {
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

  let response = await params.client.responses.create({
    model: "gpt-5.4-mini",
    input: [
      {
        role: "system",
        content: `
Você é a EduIA de um sistema de gestão escolar.
Responda em português do Brasil.
Para responder perguntas sobre o sistema, use as tools disponíveis sempre que isso ajudar.
Nunca invente dados. Use as tools como fonte da verdade.
Se o usuário pedir ação sensível, preserve confirmações quando a tool exigir.
Se a pergunta for geral e não depender do sistema, responda normalmente.
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
      return (
        response.output_text?.trim() ||
        "Não foi possível gerar uma resposta no momento."
      );
    }

    const toolOutputs = await Promise.all(
      functionCalls.map(async (call) => {
        const output = await runTool(call.name as ToolName, call.arguments || "{}");

        return {
          type: "function_call_output" as const,
          call_id: call.call_id,
          output: JSON.stringify(output),
        };
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

  return (
    response.output_text?.trim() ||
    "Não foi possível gerar uma resposta no momento."
  );
}