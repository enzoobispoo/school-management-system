import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type AvaliacaoPdfInput = {
  escolaNome: string;
  turmaNome: string;
  disciplinaNome: string;
  titulo: string;
  dataAvaliacao: Date;
  formato: "CLASSICA" | "JOGO";
  questoes: Array<{
    ordem: number;
    enunciado: string;
    pontos: number | null;
    alternativas: Array<{ ordem: number; texto: string }>;
  }>;
};

function fmtDate(d: Date) {
  return d.toLocaleDateString("pt-BR");
}

export async function buildAvaliacaoPdf(input: AvaliacaoPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const body = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([595.28, 841.89]);

  const margin = 48;
  const contentW = 595.28 - margin * 2;
  let y = 790;

  page.drawRectangle({
    x: 0,
    y: 760,
    width: 595.28,
    height: 82,
    color: rgb(0.08, 0.11, 0.16),
  });
  page.drawText("Prova / Atividade", {
    x: margin,
    y: 805,
    size: 18,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(`${input.titulo}`, {
    x: margin,
    y: 783,
    size: 10,
    font: body,
    color: rgb(0.85, 0.89, 0.95),
  });

  y = 735;
  const metaLines = [
    `Escola: ${input.escolaNome}`,
    `Turma: ${input.turmaNome}`,
    `Disciplina: ${input.disciplinaNome}`,
    `Data: ${fmtDate(input.dataAvaliacao)}`,
    `Formato: ${input.formato === "JOGO" ? "Jogo (versão impressa)" : "Clássica"}`,
  ];
  for (const line of metaLines) {
    page.drawText(line, {
      x: margin,
      y,
      size: 10,
      font: body,
      color: rgb(0.2, 0.23, 0.28),
    });
    y -= 16;
  }

  y -= 6;
  page.drawLine({
    start: { x: margin, y },
    end: { x: margin + contentW, y },
    thickness: 0.8,
    color: rgb(0.83, 0.86, 0.9),
  });
  y -= 22;

  if (input.questoes.length === 0) {
    page.drawText(
      "Esta avaliação não possui questões cadastradas no sistema no momento.",
      {
        x: margin,
        y,
        size: 11,
        font: body,
        color: rgb(0.35, 0.38, 0.43),
      }
    );
    return pdf.save();
  }

  const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const questao of input.questoes) {
    if (y < 120) break;
    const title = `${questao.ordem}. ${questao.enunciado}${
      questao.pontos != null ? ` (${questao.pontos} ponto(s))` : ""
    }`;
    page.drawText(title, {
      x: margin,
      y,
      size: 11,
      font: bold,
      color: rgb(0.1, 0.12, 0.16),
      maxWidth: contentW,
      lineHeight: 13,
    });
    y -= 20;

    if (questao.alternativas.length > 0) {
      for (const [i, alt] of questao.alternativas.entries()) {
        if (y < 100) break;
        page.drawText(`${alpha[i] ?? `${i + 1}`}) ${alt.texto}`, {
          x: margin + 14,
          y,
          size: 10,
          font: body,
          color: rgb(0.2, 0.23, 0.28),
          maxWidth: contentW - 20,
          lineHeight: 12,
        });
        y -= 16;
      }
    } else {
      page.drawText("Resposta:", {
        x: margin + 14,
        y,
        size: 10,
        font: body,
        color: rgb(0.35, 0.38, 0.43),
      });
      y -= 14;
      page.drawLine({
        start: { x: margin + 14, y },
        end: { x: margin + contentW - 14, y },
        thickness: 0.6,
        color: rgb(0.8, 0.83, 0.88),
      });
      y -= 18;
    }
  }

  return pdf.save();
}
