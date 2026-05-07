import OpenAI from "openai";
import { EDUIA_PRODUCT_CONTEXT } from "@/lib/ai/product-domain";

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function runAiFallback(params: {
  client: OpenAI;
  message: string;
  context: unknown;
  conversationMessages?: ConversationMessage[];
}) {
  const conversationHistory =
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

  const response = await params.client.responses.create({
    model: "gpt-5.4-mini",
    input: [
      {
        role: "system",
        content: `
Você é a EduIA em modo contextual — copiloto escolar: priorize clareza, dados do contexto e próximos passos úteis.
${EDUIA_PRODUCT_CONTEXT}

Regras:
- Responda em português do Brasil, objetivo e natural para equipe escolar.
- Use APENAS os dados do JSON de contexto abaixo; não invente números, nomes ou datas.
- Considere o histórico recente para perguntas de continuação.
- Se faltar dado no contexto, diga claramente que o sistema não trouxe essa informação neste momento.
- Quando fizer sentido, use tópicos curtos e sugira onde o usuário pode ir na interface (/financeiro, /turmas, /operacao, etc.).
`,
      },
      {
        role: "user",
        content: `Contexto do sistema:
${JSON.stringify(params.context, null, 2)}

Histórico recente da conversa:
${conversationHistory}

Pergunta atual do usuário:
${params.message}`,
      },
    ],
    store: false,
  });

  return (
    response.output_text?.trim() ||
    "Não foi possível gerar uma resposta no momento."
  );
}