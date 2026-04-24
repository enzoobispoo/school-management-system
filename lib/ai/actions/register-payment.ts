import { prisma } from "@/lib/prisma";
import { AiActionResult } from "@/lib/ai/types";
import { getFinanceSuggestions } from "@/lib/ai/suggestions";

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function normalizeStoredPaymentMethod(method?: string | null) {
  const normalized = method?.trim();
  return normalized || "PIX";
}

function detectPaymentMethod(method?: string, fallbackMethod?: string | null) {
  const normalized = method?.trim().toLowerCase() || "";

  if (normalized.includes("pix")) return "PIX";
  if (normalized.includes("cartão") || normalized.includes("cartao")) {
    return "Cartão";
  }
  if (normalized.includes("boleto")) return "Boleto";
  if (normalized.includes("dinheiro")) return "Dinheiro";
  if (normalized.includes("transfer")) return "Transferência";

  return normalizeStoredPaymentMethod(fallbackMethod);
}

async function findLatestOpenPaymentByStudentName(studentName: string) {
  const sanitized = studentName.trim();

  if (!sanitized) {
    return { type: "missing_name" as const };
  }

  const matches = await prisma.pagamento.findMany({
    where: {
      status: {
        in: ["PENDENTE", "ATRASADO"],
      },
      matricula: {
        aluno: {
          nome: {
            contains: sanitized,
            mode: "insensitive",
          },
        },
      },
    },
    include: {
      matricula: {
        include: {
          aluno: true,
          turma: {
            include: {
              curso: true,
            },
          },
        },
      },
    },
    orderBy: [{ vencimento: "asc" }, { createdAt: "desc" }],
    take: 5,
  });

  if (matches.length === 0) {
    return { type: "not_found" as const };
  }

  const uniqueStudents = Array.from(
    new Set(matches.map((payment) => payment.matricula.aluno.nome))
  );

  if (uniqueStudents.length > 1) {
    return {
      type: "ambiguous" as const,
      options: uniqueStudents,
    };
  }

  return {
    type: "found" as const,
    payment: matches[0],
  };
}

export async function registerPayment(params: {
  studentName?: string;
  paymentMethod?: string;
  confirmed: boolean;
}): Promise<AiActionResult> {
  const studentName = params.studentName?.trim() || "";

  const settings = await prisma.escolaSettings.findUnique({
    where: { id: "default" },
    select: {
      metodoPagamentoPadrao: true,
    },
  });

  const paymentMethod = detectPaymentMethod(
    params.paymentMethod,
    settings?.metodoPagamentoPadrao
  );

  if (!params.confirmed) {
    const previewStudentName = studentName || "do aluno desejado";

    return {
      message: `Confirma o registro do pagamento pendente/atrasado mais recente de ${previewStudentName} via ${paymentMethod}? Se quiser continuar, responda: "confirmar pagamento ${previewStudentName}".`,
      suggestions: studentName
        ? [
            {
              label: "Confirmar pagamento",
              prompt: `confirmar pagamento ${studentName}`,
            },
          ]
        : getFinanceSuggestions(),
      executed: false,
    };
  }

  const match = await findLatestOpenPaymentByStudentName(studentName);

  if (match.type === "missing_name") {
    return {
      message:
        "Não consegui identificar o nome do aluno. Tente algo como: registrar pagamento do aluno Enzo Bispo via pix",
      suggestions: getFinanceSuggestions(),
      executed: false,
    };
  }

  if (match.type === "not_found") {
    return {
      message: "Não encontrei pagamentos pendentes ou atrasados para esse aluno.",
      suggestions: getFinanceSuggestions(),
      executed: false,
    };
  }

  if (match.type === "ambiguous") {
    return {
      message: `Encontrei mais de um aluno com esse nome. Seja mais específico. Opções encontradas:\n\n${match.options
        .map((name) => `• ${name}`)
        .join("\n")}`,
      suggestions: getFinanceSuggestions(),
      executed: false,
    };
  }

  const updatedPayment = await prisma.pagamento.update({
    where: { id: match.payment.id },
    data: {
      status: "PAGO",
      dataPagamento: new Date(),
      metodoPagamento: paymentMethod,
    },
    include: {
      matricula: {
        include: {
          aluno: true,
          turma: {
            include: {
              curso: true,
            },
          },
        },
      },
    },
  });

  await prisma.notificacao.create({
    data: {
      tipo: "PAGAMENTO_CONFIRMADO",
      titulo: "Pagamento registrado pela EduIA",
      mensagem: `Pagamento de ${updatedPayment.matricula.aluno.nome} foi registrado com sucesso.`,
      entidadeTipo: "PAGAMENTO",
      entidadeId: updatedPayment.id,
    },
  });

  return {
    message: `Pagamento registrado com sucesso para ${
      updatedPayment.matricula.aluno.nome
    } — ${updatedPayment.matricula.turma.curso.nome} — ${formatCurrency(
      Number(updatedPayment.valor)
    )} via ${paymentMethod}.`,
    suggestions: getFinanceSuggestions(),
    executed: true,
  };
}