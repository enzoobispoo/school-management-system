"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Send, AlertTriangle, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/export/export-to-csv";
import { InadimplenciaChart } from "@/components/relatorios/inadimplencia-chart";
import Link from "next/link";

type Item = {
  id: string;
  descricao: string;
  valor: number;
  status: string;
  vencimento: string;
  diasAtraso: number;
  aluno: { id: string; nome: string; email: string | null; telefone: string | null };
  curso: string;
  turma: string;
};

type Meta = { total: number; totalValor: number; totalAtrasados: number; totalPendentes: number };

function fmt(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

export function InadimplenciaReport() {
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState({ de: "", ate: "" });
  const [data, setData] = useState<Item[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sendingLote, setSendingLote] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const totalPages = data.length > 0 ? Math.ceil(data.length / PAGE_SIZE) : 1;
  const paginated = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const buscar = useCallback(async (filtro: { de: string; ate: string }) => {
    setLoading(true);
    setSelected(new Set());
    setPage(1);
    try {
      const params = new URLSearchParams();
      if (filtro.de) params.set("de", filtro.de);
      if (filtro.ate) params.set("ate", filtro.ate);
      const res = await fetch(`/api/relatorios/inadimplencia?${params}`);
      const json = await res.json();
      if (res.ok) {
        setData(json.data);
        setMeta(json.meta);
      } else {
        toast.error(json.error || "Erro ao carregar dados");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // busca inicial sem filtro
  useEffect(() => { buscar({ de: "", ate: "" }); }, [buscar]);

  function handleBuscar() {
    setFiltroAtivo({ de, ate });
    buscar({ de, ate });
  }

  function handleLimpar() {
    setDe("");
    setAte("");
    setFiltroAtivo({ de: "", ate: "" });
    buscar({ de: "", ate: "" });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === data.length ? new Set() : new Set(data.map((d) => d.id))
    );
  }

  async function handleSendLote() {
    if (selected.size === 0) return;

    const ids = Array.from(selected);
    const semContato = data.filter(
      (d) => ids.includes(d.id) && !d.aluno.email && !d.aluno.telefone
    );

    if (semContato.length > 0) {
      const nomes = semContato.map((d) => d.aluno.nome).join(", ");
      const continuar = confirm(
        `${semContato.length} aluno(s) sem e-mail ou WhatsApp cadastrado:\n${nomes}\n\nDeseja enviar apenas para os demais?`
      );
      if (!continuar) return;
    }

    const idsValidos = ids.filter((id) => {
      const item = data.find((d) => d.id === id);
      return item && (item.aluno.email || item.aluno.telefone);
    });

    if (idsValidos.length === 0) {
      toast.error("Nenhum aluno selecionado possui e-mail ou WhatsApp cadastrado.");
      return;
    }

    setSendingLote(true);
    try {
      const results = await Promise.allSettled(
        idsValidos.map((id) =>
          fetch("/api/cobrancas/enviar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId: id }),
          })
        )
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const fail = results.length - ok;
      if (ok > 0) toast.success(`${ok} cobrança(s) enviada(s) com sucesso`);
      if (fail > 0) toast.error(`${fail} cobrança(s) falharam`);
      setSelected(new Set());
    } finally {
      setSendingLote(false);
    }
  }

  function handleExport() {
    if (!data.length) return;
    exportToCSV(
      data.map((d) => ({
        Aluno: d.aluno.nome,
        Email: d.aluno.email ?? "",
        Telefone: d.aluno.telefone ?? "",
        Curso: d.curso,
        Turma: d.turma,
        Descrição: d.descricao,
        Valor: d.valor,
        Vencimento: fmtDate(d.vencimento),
        Status: d.status,
        "Dias em atraso": d.diasAtraso,
      })),
      `inadimplencia-${new Date().toISOString().slice(0, 10)}.csv`
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros + Ações */}
      <div className="rounded-[20px] border border-border/50 bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Vencimento de</label>
              <input
                type="date"
                value={de}
                onChange={(e) => setDe(e.target.value)}
                className="h-9 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-foreground/30"
              />
            </div>
            <span className="mt-5 text-sm text-muted-foreground">—</span>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">até</label>
              <input
                type="date"
                value={ate}
                onChange={(e) => setAte(e.target.value)}
                className="h-9 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-foreground/30"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-5">
            <Button size="sm" className="rounded-2xl" onClick={handleBuscar} disabled={loading}>
              {loading ? "Buscando..." : "Buscar"}
            </Button>
            {(filtroAtivo.de || filtroAtivo.ate) && (
              <Button variant="ghost" size="sm" className="rounded-2xl text-muted-foreground" onClick={handleLimpar}>
                Limpar
              </Button>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {selected.size > 0 && (
              <Button size="sm" className="rounded-2xl gap-1.5" onClick={handleSendLote} disabled={sendingLote}>
                <Send className="h-3.5 w-3.5" />
                {sendingLote ? "Enviando..." : `Cobrar ${selected.size}`}
              </Button>
            )}
            <Button variant="outline" size="sm" className="rounded-2xl gap-1.5" onClick={handleExport} disabled={!data.length}>
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Resumo */}
      {meta && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total em aberto", value: fmt(meta.totalValor), icon: DollarSign },
            { label: "Atrasados", value: meta.totalAtrasados, icon: AlertTriangle },
            { label: "Pendentes", value: meta.totalPendentes, icon: Clock },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-[20px] border border-border/50 bg-card p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-semibold text-foreground">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gráfico */}
      {data.length > 0 && (
        <InadimplenciaChart data={data.map((d) => ({ vencimento: String(d.vencimento), valor: d.valor, status: d.status }))} />
      )}

      {/* Tabela */}
      {loading ? (
        <div className="rounded-[24px] border border-border/50 bg-card p-8 text-sm text-muted-foreground">
          Carregando...
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-border/60 bg-card p-12 text-center">
          <p className="text-sm font-medium text-foreground">Nenhuma inadimplência encontrada</p>
          <p className="mt-1 text-sm text-muted-foreground">Todos os pagamentos estão em dia para o período selecionado.</p>
        </div>
      ) : (
        <>
        <div className="rounded-[24px] border border-border/50 bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selected.size === data.length && data.length > 0}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Aluno</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Curso / Turma</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descrição</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Valor</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vencimento</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((item) => (
                <tr key={item.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/alunos/${item.aluno.id}`} className="font-medium text-foreground hover:underline">
                      {item.aluno.nome}
                    </Link>
                    {item.aluno.telefone && (
                      <p className="text-xs text-muted-foreground">{item.aluno.telefone}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <p>{item.curso}</p>
                    <p className="text-xs">{item.turma}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.descricao}</td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">{fmt(item.valor)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {fmtDate(item.vencimento)}
                    {item.diasAtraso > 0 && (
                      <p className="text-xs text-red-500">{item.diasAtraso}d atraso</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.status === "ATRASADO"
                        ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                    }`}>
                      {item.status === "ATRASADO" ? "Atrasado" : "Pendente"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.length)} de {data.length}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-xl" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
              <span className="text-xs">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" className="rounded-xl" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Próximo</Button>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
}
