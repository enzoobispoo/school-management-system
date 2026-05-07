import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDateBR(d: Date) {
  return d.toLocaleDateString("pt-BR");
}

function fmtDateTimeBR(d: Date) {
  return d.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function baselineFromTop(pageHeight: number, distFromTop: number) {
  return pageHeight - distFromTop;
}

function wrapWords(
  font: PDFFont,
  text: string,
  fontSize: number,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/)) {
    const trial = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(trial, fontSize) <= maxWidth) {
      current = trial;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export type DemonstrativoIrLinha = {
  dataPagamento: Date;
  competenciaMes: number;
  competenciaAno: number;
  descricao: string;
  valor: number;
};

export type DemonstrativoIrPdfInput = {
  schoolName: string;
  schoolCnpj?: string | null;
  schoolAddress?: string | null;
  anoCalendario: number;
  alunoNome: string;
  alunoCpf?: string | null;
  linhas: DemonstrativoIrLinha[];
  emitidoEm: Date;
};

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 52;
const ROW_H = 22;
const TABLE_HEADER_H = 26;

export async function buildDemonstrativoIrPdf(
  input: DemonstrativoIrPdfInput
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const body = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const navy = rgb(0.11, 0.22, 0.38);
  const navySoft = rgb(0.14, 0.28, 0.46);
  const ink = rgb(0.12, 0.13, 0.16);
  const muted = rgb(0.38, 0.4, 0.44);
  const border = rgb(0.86, 0.88, 0.92);
  const fillSoft = rgb(0.96, 0.97, 0.99);
  const fillHeader = rgb(0.94, 0.96, 0.99);

  const contentW = PAGE_W - MARGIN * 2;
  const totalPaid = input.linhas.reduce((s, l) => s + l.valor, 0);

  let page = pdf.addPage([PAGE_W, PAGE_H]);

  const colData = MARGIN + 8;
  const colComp = MARGIN + 88;
  const colDesc = MARGIN + 158;
  const colVal = PAGE_W - MARGIN - 8;

  function drawPageHeader(p: PDFPage, isContinuation: boolean) {
    let d = 0;

    p.drawRectangle({
      x: 0,
      y: PAGE_H - 82,
      width: PAGE_W,
      height: 82,
      color: navy,
    });

    p.drawText(
      isContinuation ? "Demonstrativo IR (continuação)" : "Demonstrativo para Imposto de Renda",
      {
        x: MARGIN,
        y: baselineFromTop(PAGE_H, 38),
        size: isContinuation ? 14 : 17,
        font: bold,
        color: rgb(1, 1, 1),
      }
    );

    const sub = isContinuation
      ? `${input.schoolName} · ${input.alunoNome} · ${input.anoCalendario}`
      : `Pagamentos de mensalidades / educação — ano-calendário ${input.anoCalendario}`;
    p.drawText(sub, {
      x: MARGIN,
      y: baselineFromTop(PAGE_H, 58),
      size: 9,
      font: body,
      color: rgb(0.78, 0.84, 0.94),
    });

    const rightRef = `Emissão ${fmtDateTimeBR(input.emitidoEm)}`;
    const tw = body.widthOfTextAtSize(rightRef, 8.5);
    p.drawText(rightRef, {
      x: PAGE_W - MARGIN - tw,
      y: baselineFromTop(PAGE_H, 50),
      size: 8.5,
      font: body,
      color: rgb(0.72, 0.78, 0.88),
    });

    d = 98;

    if (!isContinuation) {
      const boxH =
        26 +
        (input.schoolCnpj?.trim() ? 12 : 0) +
        wrapWords(body, input.schoolAddress?.trim() || "", 9, contentW - 24).length * 11 +
        10;

      p.drawRectangle({
        x: MARGIN,
        y: PAGE_H - d - boxH,
        width: contentW,
        height: boxH,
        color: fillSoft,
        borderColor: border,
        borderWidth: 0.75,
      });

      p.drawRectangle({
        x: MARGIN,
        y: PAGE_H - d - 24,
        width: contentW,
        height: 24,
        color: fillHeader,
        borderColor: border,
        borderWidth: 0.75,
      });

      p.drawText("INSTITUIÇÃO DECLARANTE", {
        x: MARGIN + 10,
        y: baselineFromTop(PAGE_H, d + 15),
        size: 8,
        font: bold,
        color: navySoft,
      });

      d += 30;
      p.drawText(input.schoolName, {
        x: MARGIN + 10,
        y: baselineFromTop(PAGE_H, d),
        size: 11,
        font: bold,
        color: ink,
      });
      d += 14;

      if (input.schoolCnpj?.trim()) {
        p.drawText(`CNPJ ${input.schoolCnpj.trim()}`, {
          x: MARGIN + 10,
          y: baselineFromTop(PAGE_H, d),
          size: 9,
          font: body,
          color: muted,
        });
        d += 12;
      }

      if (input.schoolAddress?.trim()) {
        const addrLines = wrapWords(body, input.schoolAddress.trim(), 9, contentW - 20);
        for (const ln of addrLines) {
          p.drawText(ln, {
            x: MARGIN + 10,
            y: baselineFromTop(PAGE_H, d),
            size: 9,
            font: body,
            color: muted,
          });
          d += 11;
        }
      }

      d += 14;

      const tomH = 24 + 14 + (input.alunoCpf?.trim() ? 12 : 0) + 8;
      p.drawRectangle({
        x: MARGIN,
        y: PAGE_H - d - tomH,
        width: contentW,
        height: tomH,
        color: fillSoft,
        borderColor: border,
        borderWidth: 0.75,
      });

      p.drawRectangle({
        x: MARGIN,
        y: PAGE_H - d - 22,
        width: contentW,
        height: 22,
        color: fillHeader,
        borderColor: border,
        borderWidth: 0.75,
      });

      p.drawText("BENEFICIÁRIO DO PAGAMENTO (ALUNO)", {
        x: MARGIN + 10,
        y: baselineFromTop(PAGE_H, d + 14),
        size: 8,
        font: bold,
        color: navySoft,
      });

      d += 28;
      p.drawText(input.alunoNome, {
        x: MARGIN + 10,
        y: baselineFromTop(PAGE_H, d),
        size: 11,
        font: bold,
        color: ink,
      });
      d += 14;

      if (input.alunoCpf?.trim()) {
        p.drawText(`CPF ${input.alunoCpf.trim()}`, {
          x: MARGIN + 10,
          y: baselineFromTop(PAGE_H, d),
          size: 9,
          font: body,
          color: muted,
        });
        d += 12;
      }

      d += 18;
    }

    p.drawText("DETALHAMENTO DOS PAGAMENTOS REALIZADOS NO ANO-CALENDÁRIO", {
      x: MARGIN,
      y: baselineFromTop(PAGE_H, d),
      size: 8,
      font: bold,
      color: navySoft,
    });
    d += 16;

    p.drawRectangle({
      x: MARGIN,
      y: PAGE_H - d - TABLE_HEADER_H,
      width: contentW,
      height: TABLE_HEADER_H,
      color: fillHeader,
      borderColor: border,
      borderWidth: 0.75,
    });

    p.drawText("Data pagamento", {
      x: colData,
      y: baselineFromTop(PAGE_H, d + 17),
      size: 7.5,
      font: bold,
      color: muted,
    });
    p.drawText("Competência", {
      x: colComp,
      y: baselineFromTop(PAGE_H, d + 17),
      size: 7.5,
      font: bold,
      color: muted,
    });
    p.drawText("Descrição", {
      x: colDesc,
      y: baselineFromTop(PAGE_H, d + 17),
      size: 7.5,
      font: bold,
      color: muted,
    });

    const hv = "Valor (R$)";
    const hvw = bold.widthOfTextAtSize(hv, 7.5);
    p.drawText(hv, {
      x: colVal - hvw,
      y: baselineFromTop(PAGE_H, d + 17),
      size: 7.5,
      font: bold,
      color: muted,
    });

    return d + TABLE_HEADER_H;
  }

  let tableCursor = drawPageHeader(page, false);
  /** Limite superior da área útil (-offset a partir do topo). */
  const maxCursor = PAGE_H - MARGIN;

  function exceedsPage(height: number) {
    return tableCursor + height > maxCursor - 4;
  }

  function startContinuationPage() {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    tableCursor = drawPageHeader(page, true);
  }

  const legalText =
    "Este demonstrativo é um documento auxiliar para conferência de valores pagos à instituição de ensino no ano-calendário indicado. Consideram-se apenas parcelas quitadas com data de pagamento registrada no sistema. Limites, regras de dedução e documentação exigida pela legislação tributária vigente são de responsabilidade do contribuinte e devem ser observados na Declaração de Imposto de Renda. Este relatório não substitui comprovantes oficiais exigidos pela Receita Federal ou órgãos competentes.";
  const legalLines = wrapWords(body, legalText, 8.2, contentW - 8);
  const legalBlockH = legalLines.length * 10 + 28 + 52;

  if (input.linhas.length === 0) {
    if (exceedsPage(48)) startContinuationPage();
    page.drawRectangle({
      x: MARGIN,
      y: PAGE_H - tableCursor - 48,
      width: contentW,
      height: 48,
      borderColor: border,
      borderWidth: 0.75,
    });
    page.drawText(
      `Não há pagamentos quitados com data registrada em ${input.anoCalendario}.`,
      {
        x: MARGIN + 12,
        y: baselineFromTop(PAGE_H, tableCursor + 28),
        size: 10,
        font: body,
        color: muted,
      }
    );
    tableCursor += 56;
  }

  for (const linha of input.linhas) {
    if (exceedsPage(ROW_H)) startContinuationPage();
    page.drawRectangle({
      x: MARGIN,
      y: PAGE_H - tableCursor - ROW_H,
      width: contentW,
      height: ROW_H,
      borderColor: border,
      borderWidth: 0.5,
    });

    page.drawText(fmtDateBR(linha.dataPagamento), {
      x: colData,
      y: baselineFromTop(PAGE_H, tableCursor + 14),
      size: 9,
      font: body,
      color: ink,
    });

    const comp = `${String(linha.competenciaMes).padStart(2, "0")}/${linha.competenciaAno}`;
    page.drawText(comp, {
      x: colComp,
      y: baselineFromTop(PAGE_H, tableCursor + 14),
      size: 9,
      font: body,
      color: ink,
    });

    const desc =
      linha.descricao.length > 48 ? `${linha.descricao.slice(0, 45)}…` : linha.descricao;
    page.drawText(desc, {
      x: colDesc,
      y: baselineFromTop(PAGE_H, tableCursor + 14),
      size: 9,
      font: body,
      color: ink,
    });

    const vs = fmtBRL(linha.valor);
    const vw = body.widthOfTextAtSize(vs, 9);
    page.drawText(vs, {
      x: colVal - vw,
      y: baselineFromTop(PAGE_H, tableCursor + 14),
      size: 9,
      font: body,
      color: ink,
    });

    tableCursor += ROW_H;
  }

  const totalH = 36;
  if (exceedsPage(totalH + 20 + legalBlockH)) startContinuationPage();
  page.drawRectangle({
    x: MARGIN,
    y: PAGE_H - tableCursor - totalH,
    width: contentW,
    height: totalH,
    color: rgb(0.93, 0.96, 0.98),
    borderColor: navySoft,
    borderWidth: 1,
  });

  page.drawText(`Total pago em ${input.anoCalendario} (registrado)`, {
    x: MARGIN + 12,
    y: baselineFromTop(PAGE_H, tableCursor + 22),
    size: 10,
    font: bold,
    color: navy,
  });

  const ts = fmtBRL(totalPaid);
  const tsw = bold.widthOfTextAtSize(ts, 13);
  page.drawText(ts, {
    x: PAGE_W - MARGIN - 12 - tsw,
    y: baselineFromTop(PAGE_H, tableCursor + 20),
    size: 13,
    font: bold,
    color: navy,
  });

  tableCursor += totalH + 20;

  if (exceedsPage(legalBlockH)) startContinuationPage();

  page.drawRectangle({
    x: MARGIN,
    y: PAGE_H - tableCursor - legalLines.length * 10 - 28,
    width: contentW,
    height: legalLines.length * 10 + 28,
    color: rgb(0.99, 0.99, 1),
    borderColor: border,
    borderWidth: 0.6,
  });

  page.drawText("Observações", {
    x: MARGIN + 8,
    y: baselineFromTop(PAGE_H, tableCursor + 14),
    size: 8,
    font: bold,
    color: muted,
  });
  tableCursor += 20;

  for (const ln of legalLines) {
    page.drawText(ln, {
      x: MARGIN + 8,
      y: baselineFromTop(PAGE_H, tableCursor),
      size: 8.2,
      font: body,
      color: muted,
    });
    tableCursor += 10;
  }

  tableCursor += 16;

  page.drawLine({
    start: { x: MARGIN, y: baselineFromTop(PAGE_H, tableCursor) },
    end: { x: PAGE_W - MARGIN, y: baselineFromTop(PAGE_H, tableCursor) },
    thickness: 0.4,
    color: border,
  });
  tableCursor += 12;

  const foot =
    "Gerado eletronicamente — conferir totais antes de utilizar na declaração.";
  page.drawText(foot, {
    x: MARGIN,
    y: baselineFromTop(PAGE_H, tableCursor),
    size: 8,
    font: body,
    color: rgb(0.5, 0.52, 0.55),
  });

  const sig = `${input.schoolName.slice(0, 42)}${input.schoolName.length > 42 ? "…" : ""}`;
  const sigW = body.widthOfTextAtSize(sig, 8);
  page.drawText(sig, {
    x: PAGE_W - MARGIN - sigW,
    y: baselineFromTop(PAGE_H, tableCursor),
    size: 8,
    font: body,
    color: rgb(0.5, 0.52, 0.55),
  });

  return pdf.save();
}
