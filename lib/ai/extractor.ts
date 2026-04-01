import OpenAI from "openai";
import { PaymentActionParams } from "@/lib/ai/types";

function extractPaymentActionParamsLocally(
  message: string
): PaymentActionParams {
  const lower = message.toLowerCase();

  let paymentMethod = "";

  if (lower.includes("pix")) paymentMethod = "PIX";
  else if (lower.includes("boleto")) paymentMethod = "Boleto";
  else if (lower.includes("dinheiro")) paymentMethod = "Dinheiro";
  else if (lower.includes("cartão") || lower.includes("cartao")) {
    paymentMethod = "Cartão";
  } else if (lower.includes("transfer")) {
    paymentMethod = "Transferência";
  }

  let studentName = message
    .replace(/confirmar pagamento/gi, "")
    .replace(/registrar pagamento do aluno/gi, "")
    .replace(/registrar pagamento de/gi, "")
    .replace(/marcar pagamento como pago de/gi, "")
    .replace(/dar baixa no pagamento de/gi, "")
    .replace(/via pix/gi, "")
    .replace(/via boleto/gi, "")
    .replace(/via dinheiro/gi, "")
    .replace(/via cart[aã]o/gi, "")
    .replace(/via transfer[êe]ncia/gi, "")
    .trim();

  return {
    studentName,
    paymentMethod,
  };
}

export async function extractPaymentActionParams(
  client: OpenAI,
  message: string
): Promise<PaymentActionParams> {
  try {
    const response = await client.responses.create({
      model: "gpt-5.4-mini",
      input: [
        {
          role: "system",
          content: `
Extraia parâmetros de ações financeiras.

Retorne apenas JSON válido no formato:
{"studentName":"","paymentMethod":""}

Regras:
- studentName: nome do aluno, quando houver.
- paymentMethod: PIX, Cartão, Boleto, Dinheiro, Transferência.
- Se não encontrar um campo, retorne string vazia.
`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      store: false,
    });

    const raw = response.output_text?.trim();

    if (!raw) {
      return extractPaymentActionParamsLocally(message);
    }

    const parsed = JSON.parse(raw) as PaymentActionParams;

    return {
      studentName: parsed.studentName?.trim() || "",
      paymentMethod: parsed.paymentMethod?.trim() || "",
    };
  } catch (error) {
    console.error("Erro ao extrair parâmetros com OpenAI. Usando fallback local.", error);
    return extractPaymentActionParamsLocally(message);
  }
}