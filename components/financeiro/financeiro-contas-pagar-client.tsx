"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Conta = {
  id: string;
  fornecedorNome: string;
  descricao: string;
  categoria: string | null;
  valor: unknown;
  vencimento: string;
  status: string;
  dataPagamento: string | null;
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
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ?
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
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
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3">
                    {r.status === "PENDENTE" ?
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        type="button"
                        onClick={() => void marcarPago(r.id)}
                      >
                        Pagar
                      </Button>
                    : null}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
