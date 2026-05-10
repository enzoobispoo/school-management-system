"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Conta = {
  id: string;
  fornecedorNome: string;
  descricao: string;
  categoria: string | null;
  valor: unknown;
  vencimento: string;
  status: string;
  dataPagamento: string | null;
  numeroDocumentoFiscal: string | null;
  anexoUrl: string | null;
};

export function FinanceiroContasPagarClient() {
  const [rows, setRows] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    fornecedorNome: "",
    descricao: "",
    categoria: "",
    valor: "",
    vencimento: "",
  });
  const [nfDialog, setNfDialog] = useState<Conta | null>(null);
  const [nfNumero, setNfNumero] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/financeiro/contas-pagar", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      setRows(data.contas ?? []);
    } catch {
      toast.error("Não foi possível carregar contas a pagar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (nfDialog) {
      setNfNumero(nfDialog.numeroDocumentoFiscal ?? "");
    }
  }, [nfDialog]);

  async function create() {
    try {
      const res = await fetch("/api/financeiro/contas-pagar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fornecedorNome: form.fornecedorNome,
          descricao: form.descricao,
          categoria: form.categoria || undefined,
          valor: Number(form.valor.replace(",", ".")),
          vencimento: form.vencimento,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      toast.success("Lançamento criado.");
      setForm({
        fornecedorNome: "",
        descricao: "",
        categoria: "",
        valor: "",
        vencimento: "",
      });
      await load();
    } catch {
      toast.error("Falha ao criar.");
    }
  }

  async function marcarPago(id: string) {
    try {
      const res = await fetch(`/api/financeiro/contas-pagar/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAGO",
          dataPagamento: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Marcado como pago.");
      await load();
    } catch {
      toast.error("Falha ao atualizar.");
    }
  }

  async function salvarNumeroFiscal() {
    if (!nfDialog) return;
    try {
      const res = await fetch(`/api/financeiro/contas-pagar/${nfDialog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numeroDocumentoFiscal: nfNumero.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      toast.success("Número fiscal salvo.");
      await load();
      setNfDialog((c) =>
        c ? { ...c, numeroDocumentoFiscal: nfNumero.trim() || null } : null
      );
    } catch {
      toast.error("Falha ao salvar número.");
    }
  }

  async function uploadAnexo(file: File) {
    if (!nfDialog) return;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/financeiro/contas-pagar/${nfDialog.id}/anexo`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      toast.success("PDF anexado.");
      await load();
      if (data.conta?.anexoUrl) {
        setNfDialog((c) => (c ? { ...c, anexoUrl: data.conta.anexoUrl } : null));
      }
    } catch {
      toast.error("Envie apenas PDF até 10 MB.");
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
        <p className="text-sm font-medium">Novo lançamento</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            placeholder="Fornecedor"
            value={form.fornecedorNome}
            onChange={(e) => setForm((f) => ({ ...f, fornecedorNome: e.target.value }))}
            className="rounded-xl"
          />
          <Input
            placeholder="Descrição"
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            className="rounded-xl"
          />
          <Input
            placeholder="Categoria"
            value={form.categoria}
            onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
            className="rounded-xl"
          />
          <Input
            placeholder="Valor"
            value={form.valor}
            onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
            className="rounded-xl"
          />
          <Input
            type="date"
            value={form.vencimento}
            onChange={(e) => setForm((f) => ({ ...f, vencimento: e.target.value }))}
            className="rounded-xl"
          />
          <Button type="button" className="rounded-xl" onClick={() => void create()}>
            Adicionar
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/30 text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Fornecedor</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Vencimento</th>
              <th className="px-4 py-3">NF</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ?
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Carregando…
                </td>
              </tr>
            : rows.map((r) => (
                <tr key={r.id} className="border-b border-border/40">
                  <td className="px-4 py-3 font-medium">{r.fornecedorNome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.descricao}</td>
                  <td className="px-4 py-3 tabular-nums">{String(r.valor)}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {r.vencimento.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate">
                    {r.numeroDocumentoFiscal ?? "—"}
                    {r.anexoUrl ?
                      <span className="ml-1 text-emerald-600 dark:text-emerald-400">· PDF</span>
                    : null}
                  </td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        type="button"
                        onClick={() => setNfDialog(r)}
                      >
                        NF / anexo
                      </Button>
                      {r.status === "PENDENTE" ?
                        <Button
                          size="sm"
                          variant="secondary"
                          className="rounded-xl"
                          type="button"
                          onClick={() => void marcarPago(r.id)}
                        >
                          Pagar
                        </Button>
                      : null}
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      <Dialog open={!!nfDialog} onOpenChange={(o) => !o && setNfDialog(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Documento fiscal (NF)</DialogTitle>
          </DialogHeader>
          {nfDialog ?
            <div className="grid gap-3 text-sm">
              <p className="text-muted-foreground">
                {nfDialog.fornecedorNome} — {nfDialog.descricao}
              </p>
              <label className="grid gap-1">
                <span className="text-xs text-muted-foreground">Número da nota / documento</span>
                <Input
                  value={nfNumero}
                  onChange={(e) => setNfNumero(e.target.value)}
                  className="rounded-xl"
                  placeholder="Chave, número ou referência"
                />
              </label>
              <Button type="button" className="rounded-xl" onClick={() => void salvarNumeroFiscal()}>
                Salvar número
              </Button>
              <div className="border-t border-border/50 pt-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Anexe o PDF da nota (até 10 MB).
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadAnexo(f);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl w-full"
                  onClick={() => fileRef.current?.click()}
                >
                  Enviar PDF
                </Button>
                {nfDialog.anexoUrl ?
                  <Button variant="link" className="h-auto p-0 text-sm" asChild>
                    <a href={nfDialog.anexoUrl} target="_blank" rel="noreferrer">
                      Abrir anexo atual
                    </a>
                  </Button>
                : null}
              </div>
            </div>
          : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
