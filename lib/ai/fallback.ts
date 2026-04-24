import OpenAI from "openai";

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
Você é um assistente de IA de um sistema de gestão escolar.
Responda em português do Brasil.
Seja objetivo, útil e natural.
Use APENAS os dados fornecidos no contexto.
Considere o histórico recente da conversa para entender perguntas de continuação.
Se a resposta não estiver no contexto, diga isso claramente.
Quando fizer sentido, responda em tópicos curtos.
Não invente números, nomes ou datas.
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