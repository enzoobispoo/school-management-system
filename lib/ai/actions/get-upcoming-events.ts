import { prisma } from "@/lib/prisma";
import { AiActionResult } from "@/lib/ai/types";
import { getDefaultSuggestions } from "@/lib/ai/suggestions";

function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("pt-BR");
}

export async function getUpcomingEvents(): Promise<AiActionResult> {
  const hoje = new Date();

  const proximosEventos = await prisma.evento.findMany({
    where: {
      dataInicio: { gte: hoje },
      ativo: true,
    },
    include: {
      professor: true,
      turma: true,
      curso: true,
    },
    orderBy: { dataInicio: "asc" },
    take: 6,
  });

  if (proximosEventos.length === 0) {
    return {
      message: "Não há próximos eventos cadastrados no momento.",
      suggestions: getDefaultSuggestions(),
    };
  }

  const lista = proximosEventos
    .map((evento) => {
      const detalhes = [
        `• ${evento.titulo}`,
        `Tipo: ${evento.tipo}`,
        `Data: ${formatDateTime(evento.dataInicio)}`,
        evento.curso?.nome ? `Curso: ${evento.curso.nome}` : null,
        evento.turma?.nome ? `Turma: ${evento.turma.nome}` : null,
        evento.professor?.nome ? `Professor: ${evento.professor.nome}` : null,
      ]
        .filter(Boolean)
        .join(" | ");

      return detalhes;
    })
    .join("\n");

  return {
    message: `Estes são os próximos eventos:\n\n${lista}`,
    suggestions: getDefaultSuggestions(),
  };
}