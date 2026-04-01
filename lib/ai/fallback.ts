import OpenAI from "openai";

export async function runAiFallback(params: {
  client: OpenAI;
  message: string;
  context: unknown;
}) {
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
Se a resposta não estiver no contexto, diga isso claramente.
Quando fizer sentido, responda em tópicos curtos.
Não invente números, nomes ou datas.
`,
      },
      {
        role: "user",
        content: `Contexto do sistema:\n${JSON.stringify(
          params.context,
          null,
          2
        )}\n\nPergunta do usuário:\n${params.message}`,
      },
    ],
    store: false,
  });

  return (
    response.output_text?.trim() ||
    "Não foi possível gerar uma resposta no momento."
  );
}