import "server-only";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { SchoolInvoice, SchoolInvoiceLine } from "@prisma/client";

export async function buildSchoolInvoicePdfBytes(input: {
  invoice: SchoolInvoice & { linhas: SchoolInvoiceLine[] };
  schoolNome: string;
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { invoice, schoolNome } = input;

  let y = 800;
  const left = 50;
  const lineH = 14;

  page.drawText("Documento fiscal interno", {
    x: left,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0.25, 0.25, 0.25),
  });
  y -= lineH;
  page.drawText("(Não substitui NFS-e / NF-e sem provedor homologado)", {
    x: left,
    y,
    size: 8,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });
  y -= lineH * 2;

  page.drawText(schoolNome, { x: left, y, size: 14, font: fontBold });
  y -= lineH * 2;

  page.drawText(`Nº ${invoice.sequencial} · ${invoice.tipo}`, {
    x: left,
    y,
    size: 11,
    font: fontBold,
  });
  y -= lineH * 1.5;
  page.drawText(`Tomador: ${invoice.tomadorNome}`, { x: left, y, size: 10, font });
  y -= lineH;
  if (invoice.tomadorDocumento) {
    page.drawText(`Doc.: ${invoice.tomadorDocumento}`, { x: left, y, size: 10, font });
    y -= lineH;
  }
  page.drawText(`Emissão: ${invoice.dataEmissao.toISOString().slice(0, 10)}`, {
    x: left,
    y,
    size: 10,
    font,
  });
  y -= lineH * 2;

  page.drawText("Itens", { x: left, y, size: 11, font: fontBold });
  y -= lineH * 1.5;

  const sorted = [...invoice.linhas].sort((a, b) => a.ordem - b.ordem);
  for (const ln of sorted) {
    if (y < 100) break;
    const qty = Number(ln.quantidade);
    const unit = Number(ln.valorUnitario);
    const d = Number(ln.desconto);
    const lineTot = qty * unit - d;
    page.drawText(
      `${ln.descricao.slice(0, 72)} — ${qty} x ${unit.toFixed(2)} − desc. ${d.toFixed(2)} = ${lineTot.toFixed(2)}`,
      { x: left, y, size: 9, font }
    );
    y -= lineH;
  }

  y -= lineH;
  page.drawText(`Subtotal: R$ ${Number(invoice.subtotal).toFixed(2)}`, {
    x: left,
    y,
    size: 10,
    font,
  });
  y -= lineH;
  page.drawText(`Descontos: R$ ${Number(invoice.descontoTotal).toFixed(2)}`, {
    x: left,
    y,
    size: 10,
    font,
  });
  y -= lineH;
  page.drawText(`Total: R$ ${Number(invoice.total).toFixed(2)}`, {
    x: left,
    y,
    size: 12,
    font: fontBold,
  });

  const bytes = await pdf.save();
  return bytes;
}
