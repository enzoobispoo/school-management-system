"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Row = {
  id: string;
  aluno: { nome: string };
  turma: { nome: string };
  diaVencimentoMensal: number | null;
  contratoFinanceiro: {
    valorMensalidadeBase: unknown;
    descontoPercentual: unknown;
    bolsaValor: unknown;
    dataInicioContrato: string | null;
    dataFimContrato: string | null;
    reajusteAnualPercentual: unknown;
    observacoes: string | null;
  } | null;
};

export function FinanceiroContratosClient() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<Row | null>(null);
  const [form, setForm] = useState({
    valorMensalidadeBase: "",
    descontoPercentual: "",
    bolsaValor: "",
    dataInicioContrato: "",
    dataFimContrato: "",
    reajusteAnualPercentual: "",
    observacoes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/financeiro/contratos?q=${encodeURIComponent(q)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      setRows(data.matriculas ?? []);
    } catch {
      toast.error("Não foi possível carregar contratos.");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  function openEdit(r: Row) {
    setSel(r);
    const c = r.contratoFinanceiro;
    setForm({
      valorMensalidadeBase:
        c?.valorMensalidadeBase != null ? String(c.valorMensalidadeBase) : "",
      descontoPercentual:
        c?.descontoPercentual != null ? String(c.descontoPercentual) : "",
      bolsaValor: c?.bolsaValor != null ? String(c.bolsaValor) : "",
      dataInicioContrato: c?.dataInicioContrato?.slice(0, 10) ?? "",
      dataFimContrato: c?.dataFimContrato?.slice(0, 10) ?? "",
      reajusteAnualPercentual:
        c?.reajusteAnualPercentual != null ? String(c.reajusteAnualPercentual) : "",
      observacoes: c?.observacoes ?? "",
    });
    setOpen(true);
  }

  async function save() {
    if (!sel) return;
    try {
      const res = await fetch(`/api/financeiro/contratos/${sel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valorMensalidadeBase: form.valorMensalidadeBase || null,
          descontoPercentual: form.descontoPercentual || null,
          bolsaValor: form.bolsaValor || null,
          dataInicioContrato: form.dataInicioContrato || null,
          dataFimContrato: form.dataFimContrato || null,
          reajusteAnualPercentual: form.reajusteAnualPercentual || null,
          observacoes: form.observacoes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      toast.success("Contrato salvo.");
      setOpen(false);
      await load();
    } catch {
      toast.error("Falha ao salvar.");
    }
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Buscar aluno ou turma…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm rounded-xl"
        />
        <Button type="button" variant="secondary" className="rounded-xl" onClick={() => void load()}>
          Buscar
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/30 text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Aluno</th>
              <th className="px-4 py-3">Turma</th>
              <th className="px-4 py-3">Venc. (dia)</th>
              <th className="px-4 py-3">Base mensal</th>
              <th className="px-4 py-3 w-28" />
            </tr>
          </thead>
          <tbody>
            {loading ?
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Carregando…
                </td>
              </tr>
            : rows.length === 0 ?
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhuma matrícula ativa encontrada.
                </td>
              </tr>
            : rows.map((r) => (
                <tr key={r.id} className="border-b border-border/40">
                  <td className="px-4 py-3 font-medium">{r.aluno.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.turma.nome}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {r.diaVencimentoMensal ?? "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {r.contratoFinanceiro?.valorMensalidadeBase != null ?
                      String(r.contratoFinanceiro.valorMensalidadeBase)
                    : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      type="button"
                      onClick={() => openEdit(r)}
                    >
                      Editar
                    </Button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Contrato financeiro da matrícula</DialogTitle>
          </DialogHeader>
          {sel ?
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {sel.aluno.nome} · {sel.turma.nome}
              </p>
              <label className="grid gap-1">
                <span className="text-xs text-muted-foreground">Valor base mensalidade</span>
                <Input
                  value={form.valorMensalidadeBase}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, valorMensalidadeBase: e.target.value }))
                  }
                  className="rounded-xl"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-muted-foreground">Desconto %</span>
                <Input
                  value={form.descontoPercentual}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, descontoPercentual: e.target.value }))
                  }
                  className="rounded-xl"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-muted-foreground">Bolsa (R$)</span>
                <Input
                  value={form.bolsaValor}
                  onChange={(e) => setForm((f) => ({ ...f, bolsaValor: e.target.value }))}
                  className="rounded-xl"
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-xs text-muted-foreground">Início contrato</span>
                  <Input
                    type="date"
                    value={form.dataInicioContrato}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, dataInicioContrato: e.target.value }))
                    }
                    className="rounded-xl"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs text-muted-foreground">Fim contrato</span>
                  <Input
                    type="date"
                    value={form.dataFimContrato}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, dataFimContrato: e.target.value }))
                    }
                    className="rounded-xl"
                  />
                </label>
              </div>
              <label className="grid gap-1">
                <span className="text-xs text-muted-foreground">Reajuste anual %</span>
                <Input
                  value={form.reajusteAnualPercentual}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reajusteAnualPercentual: e.target.value }))
                  }
                  className="rounded-xl"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-muted-foreground">Observações</span>
                <textarea
                  value={form.observacoes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, observacoes: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
              <Button type="button" className="w-full rounded-xl" onClick={() => void save()}>
                Salvar
              </Button>
            </div>
          : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
