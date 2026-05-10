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

type MatriculaOpt = {
  id: string;
  aluno: { nome: string };
  turma: { nome: string };
};

type Neg = {
  id: string;
  status: string;
  valorProposto: unknown;
  parcelasPropostas: number | null;
  observacoes: string | null;
  decisaoObservacoes: string | null;
  parcelasGeradasEm: string | null;
  decidedAt: string | null;
  createdAt: string;
  matricula: {
    id: string;
    aluno: { nome: string };
    turma: { nome: string };
  };
  decididoPor: { id: string; nome: string | null; email: string | null } | null;
};

export function FinanceiroNegociacoesClient() {
  const [rows, setRows] = useState<Neg[]>([]);
  const [loading, setLoading] = useState(true);
  const [matriculaQuery, setMatriculaQuery] = useState("");
  const [matriculaOptions, setMatriculaOptions] = useState<MatriculaOpt[]>([]);
  const [matriculaId, setMatriculaId] = useState("");
  const [valorProposto, setValorProposto] = useState("");
  const [parcelas, setParcelas] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [parcelasOpen, setParcelasOpen] = useState(false);
  const [parcelasNeg, setParcelasNeg] = useState<Neg | null>(null);
  const [compMes, setCompMes] = useState(String(new Date().getMonth() + 1));
  const [compAno, setCompAno] = useState(String(new Date().getFullYear()));

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

  useEffect(() => {
    const t = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/financeiro/contratos?q=${encodeURIComponent(matriculaQuery.trim())}`,
            { cache: "no-store" }
          );
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error);
          setMatriculaOptions(data.matriculas ?? []);
        } catch {
          setMatriculaOptions([]);
        }
      })();
    }, 280);
    return () => clearTimeout(t);
  }, [matriculaQuery]);

  const selectedMat = matriculaId ?
    matriculaOptions.find((m) => m.id === matriculaId)
  : undefined;
  const selectedMatriculaLabel =
    selectedMat ?
      `${selectedMat.aluno.nome} — ${selectedMat.turma.nome}`
    : matriculaId ?
      `Matrícula (${matriculaId.slice(0, 8)}…)`
    : null;

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
      setMatriculaQuery("");
      setValorProposto("");
      setParcelas("");
      setObservacoes("");
      await load();
    } catch {
      toast.error("Falha ao registrar (selecione uma matrícula ativa).");
    }
  }

  async function patchStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/financeiro/negociacoes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      toast.success(`Status: ${status}`);
      await load();
    } catch {
      toast.error("Falha ao atualizar status.");
    }
  }

  async function gerarParcelas() {
    if (!parcelasNeg) return;
    try {
      const res = await fetch(`/api/financeiro/negociacoes/${parcelasNeg.id}/parcelas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competenciaMesInicio: Number(compMes),
          competenciaAnoInicio: Number(compAno),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? data?.code);
      toast.success(
        `Parcelas geradas: ${data.created ?? "?"} (ignoradas ${data.skipped ?? 0}).`
      );
      setParcelasOpen(false);
      setParcelasNeg(null);
      await load();
    } catch {
      toast.error(
        "Falha ao gerar parcelas (negociação aceita, valor e parcelas preenchidos?)."
      );
    }
  }

  function openParcelas(n: Neg) {
    setParcelasNeg(n);
    setCompMes(String(new Date().getMonth() + 1));
    setCompAno(String(new Date().getFullYear()));
    setParcelasOpen(true);
  }

  return (
    <div className="space-y-6 p-6">
      <p className="text-sm text-muted-foreground">
        Propostas sobre mensalidades. Busque matrícula ativa por aluno ou turma; depois altere o
        status e, se aceitar, gere as parcelas na primeira competência desejada.
      </p>

      <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 grid gap-2">
        <label className="text-xs font-medium text-muted-foreground">
          Matrícula (buscar)
        </label>
        <Input
          placeholder="Nome do aluno ou da turma…"
          value={matriculaQuery}
          onChange={(e) => setMatriculaQuery(e.target.value)}
          className="rounded-xl"
        />
        <div className="max-h-40 overflow-y-auto rounded-xl border border-border/50 bg-background">
          {matriculaOptions.length === 0 ?
            <p className="px-3 py-2 text-xs text-muted-foreground">
              Nenhuma matrícula nesta busca.
            </p>
          : matriculaOptions.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted/60 ${
                  matriculaId === m.id ? "bg-muted/80" : ""
                }`}
                onClick={() => setMatriculaId(m.id)}
              >
                <span className="font-medium">{m.aluno.nome}</span>
                <span className="text-xs text-muted-foreground">{m.turma.nome}</span>
              </button>
            ))
          }
        </div>
        {selectedMatriculaLabel ?
          <p className="text-xs text-muted-foreground">
            Selecionado: <span className="font-medium text-foreground">{selectedMatriculaLabel}</span>
          </p>
        : null}

        <div className="grid gap-2 sm:grid-cols-2 pt-2">
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
          <Button
            type="button"
            className="rounded-xl sm:col-span-2"
            disabled={!matriculaId.trim()}
            onClick={() => void criar()}
          >
            Registrar negociação
          </Button>
        </div>
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
              <th className="px-4 py-3">Decisão</th>
              <th className="px-4 py-3">Quando</th>
              <th className="px-4 py-3 min-w-[200px]">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ?
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Carregando…
                </td>
              </tr>
            : rows.map((r) => (
                <tr key={r.id} className="border-b border-border/40 align-top">
                  <td className="px-4 py-3 font-medium">{r.matricula.aluno.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.matricula.turma.nome}</td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {r.valorProposto != null ? String(r.valorProposto) : "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{r.parcelasPropostas ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {r.decididoPor?.nome ?? r.decididoPor?.email ?? "—"}
                    {r.parcelasGeradasEm ?
                      <span className="mt-1 block text-emerald-600 dark:text-emerald-400">
                        Parcelas geradas
                      </span>
                    : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg h-7 text-[11px] px-2"
                        type="button"
                        disabled={r.status === "CONCLUIDA"}
                        onClick={() => void patchStatus(r.id, "EM_ANALISE")}
                      >
                        Análise
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg h-7 text-[11px] px-2"
                        type="button"
                        disabled={r.status === "CONCLUIDA"}
                        onClick={() => void patchStatus(r.id, "ACEITA")}
                      >
                        Aceitar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg h-7 text-[11px] px-2"
                        type="button"
                        disabled={r.status === "CONCLUIDA"}
                        onClick={() => void patchStatus(r.id, "RECUSADA")}
                      >
                        Recusar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-lg h-7 text-[11px] px-2"
                        type="button"
                        disabled={
                          r.status !== "ACEITA" ||
                          !!r.parcelasGeradasEm ||
                          !r.parcelasPropostas ||
                          r.parcelasPropostas < 1
                        }
                        onClick={() => openParcelas(r)}
                      >
                        Gerar parcelas
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      <Dialog open={parcelasOpen} onOpenChange={setParcelasOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Gerar parcelas na mensalidade</DialogTitle>
          </DialogHeader>
          {parcelasNeg ?
            <div className="grid gap-3 text-sm">
              <p className="text-muted-foreground">
                {parcelasNeg.matricula.aluno.nome} — competência inicial dos pagamentos gerados.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1">
                  <span className="text-xs text-muted-foreground">Mês (1–12)</span>
                  <Input
                    value={compMes}
                    onChange={(e) => setCompMes(e.target.value)}
                    className="rounded-xl"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs text-muted-foreground">Ano</span>
                  <Input
                    value={compAno}
                    onChange={(e) => setCompAno(e.target.value)}
                    className="rounded-xl"
                  />
                </label>
              </div>
              <Button type="button" className="rounded-xl" onClick={() => void gerarParcelas()}>
                Confirmar geração
              </Button>
            </div>
          : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
