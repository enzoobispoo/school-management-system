import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { buildDemonstrativoIrPdf } from "@/lib/pagamentos/build-demonstrativo-ir-pdf";

export function parseAno(raw: string | null): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 2000 || n > 2100) return null;
  return Math.floor(n);
}

/** Lista anos a partir de `anos` (CSV) ou um único `ano`; dedup e ordenação decrescente. */
export function parseAnosQuery(anoQ: string | null, anosQ: string | null): number[] {
  const raw = anosQ?.trim();
  if (raw) {
    const set = new Set<number>();
    for (const part of raw.split(",")) {
      const n = parseAno(part.trim());
      if (n != null) set.add(n);
    }
    const arr = [...set].sort((a, b) => b - a).slice(0, 8);
    if (arr.length > 0) return arr;
  }
  const one = parseAno(anoQ);
  return [one ?? new Date().getFullYear() - 1];
}

export async function fetchPagamentosDemonstrativoIr(
  schoolId: string,
  alunoId: string,
  ano: number
) {
  const inicio = new Date(ano, 0, 1, 0, 0, 0, 0);
  const fim = new Date(ano, 11, 31, 23, 59, 59, 999);

  const pagamentos = await prisma.pagamento.findMany({
    where: {
      schoolId,
      status: "PAGO",
      dataPagamento: { not: null, gte: inicio, lte: fim },
      matricula: { alunoId },
    },
    orderBy: [{ dataPagamento: "asc" }, { competenciaAno: "asc" }, { competenciaMes: "asc" }],
    select: {
      dataPagamento: true,
      competenciaMes: true,
      competenciaAno: true,
      descricao: true,
      valor: true,
    },
  });

  const linhas = pagamentos.map((p) => ({
    dataPagamento: p.dataPagamento!,
    competenciaMes: p.competenciaMes,
    competenciaAno: p.competenciaAno,
    descricao: p.descricao,
    valor: Number(p.valor),
  }));

  const totalPago = linhas.reduce((s, l) => s + l.valor, 0);
  return { linhas, totalPago, quantidade: linhas.length };
}

export async function buildDemonstrativoIrPdfBytes(args: {
  schoolId: string;
  alunoId: string;
  ano: number;
  emitidoEm?: Date;
}): Promise<Uint8Array> {
  const { schoolId, alunoId, ano, emitidoEm = new Date() } = args;

  const [aluno, settings] = await Promise.all([
    prisma.aluno.findFirst({
      where: { id: alunoId, schoolId },
      select: { id: true, nome: true, cpf: true },
    }),
    prisma.escolaSettings.findUnique({
      where: { schoolId },
      select: { nomeEscola: true, cnpj: true, endereco: true },
    }),
  ]);

  if (!aluno) {
    throw new Error("Aluno não encontrado");
  }

  const { linhas } = await fetchPagamentosDemonstrativoIr(schoolId, alunoId, ano);

  return buildDemonstrativoIrPdf({
    schoolName: settings?.nomeEscola?.trim() || "Instituição de ensino",
    schoolCnpj: settings?.cnpj,
    schoolAddress: settings?.endereco,
    anoCalendario: ano,
    alunoNome: aluno.nome,
    alunoCpf: aluno.cpf,
    linhas,
    emitidoEm,
  });
}

export async function mergePdfBuffers(buffers: Uint8Array[]): Promise<Uint8Array> {
  if (buffers.length === 0) {
    throw new Error("Nenhum PDF para mesclar");
  }
  if (buffers.length === 1) {
    return buffers[0];
  }
  const merged = await PDFDocument.create();
  for (const raw of buffers) {
    const doc = await PDFDocument.load(raw);
    const copied = await merged.copyPages(doc, doc.getPageIndices());
    copied.forEach((p) => merged.addPage(p));
  }
  return merged.save();
}
