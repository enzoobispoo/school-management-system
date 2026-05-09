"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Neg = {
  id: string;
  status: string;
  valorProposto: unknown;
  parcelasPropostas: number | null;
  observacoes: string | null;
  createdAt: string;
  matricula: {
    id: string;
    aluno: { nome: string };
    turma: { nome: string };
  };
};

export function FinanceiroNegociacoesClient() {
  const [rows, setRows] = useState<Neg[]>([]);
  const [loading, setLoading] = useState(true);
  const [matriculaId, setMatriculaId] = useState("");
  const [valorProposto, setValorProposto] = useState("");
  const [parcelas, setParcelas] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/financeiro/negociacoes", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      setRows(data.negociacoes ?? []);
    } catch {
      toast.error("Não foi possível carregar negociações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function criar() {
    try {
      const res = await fetch("/api/financeiro/negociacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matriculaId: matriculaId.trim(),
          valorProposto:
            valorProposto ? Number(valorProposto.replace(",", ".")) : undefined,
          parcelasPropostas: parcelas ? Number(parcelas) : undefined,
          observacoes: observacoes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      toast.success("Negociação registrada.");
      setMatriculaId("");
      setValorProposto("");
      setParcelas("");
      setObservacoes("");
      await load();
    } catch {
      toast.error("Falha ao registrar (confira o ID da matrícula).");
    }
  }

  return (
    <div className="space-y-6 p-6">
      <p className="text-sm text-muted-foreground">
        Registro de propostas e acordos sobre mensalidades. Use o ID da matrícula (copie do sistema
        ou da URL ao editar aluno/turma quando disponível).
      </p>

      <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 grid gap-2 sm:grid-cols-2">
        <Input
          placeholder="ID da matrícula"
          value={matriculaId}
          onChange={(e) => setMatriculaId(e.target.value)}
          className="rounded-xl sm:col-span-2"
        />
        <Input
          placeholder="Valor proposto"
          value={valorProposto}
          onChange={(e) => setValorProposto(e.target.value)}
          className="rounded-xl"
        />
        <Input
          placeholder="Parcelas propostas"
          value={parcelas}
          onChange={(e) => setParcelas(e.target.value)}
          className="rounded-xl"
        />
        <textarea
          placeholder="Observações"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={2}
          className="sm:col-span-2 rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />
        <Button type="button" className="rounded-xl sm:col-span-2" onClick={() => void criar()}>
          Registrar negociação
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/30 text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Aluno</th>
              <th className="px-4 py-3">Turma</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Parcelas</th>
              <th className="px-4 py-3">Quando</th>
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
                  <td className="px-4 py-3 font-medium">{r.matricula.aluno.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.matricula.turma.nome}</td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {r.valorProposto != null ? String(r.valorProposto) : "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{r.parcelasPropostas ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString("pt-BR")}
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
