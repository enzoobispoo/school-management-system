"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Line = { descricao: string; quantidade: string; valorUnitario: string; desconto: string };

type Nota = {
  id: string;
  sequencial: number;
  tipo: string;
  status: string;
  tomadorNome: string;
  total: unknown;
  dataEmissao: string;
  emissionRequestedAt: string | null;
};

export function FinanceiroNotasClient() {
  const [rows, setRows] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);
  const [tomadorNome, setTomadorNome] = useState("");
  const [tomadorDocumento, setTomadorDocumento] = useState("");
  const [tipo, setTipo] = useState("OUTRO");
  const [lines, setLines] = useState<Line[]>([
    { descricao: "Serviço / mensalidade", quantidade: "1", valorUnitario: "", desconto: "0" },
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/financeiro/notas", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      setRows(data.notas ?? []);
    } catch {
      toast.error("Não foi possível carregar documentos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function criar() {
    try {
      const res = await fetch("/api/financeiro/notas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          tomadorNome,
          tomadorDocumento: tomadorDocumento || undefined,
          linhas: lines.map((ln) => ({
            descricao: ln.descricao,
            quantidade: Number(ln.quantidade.replace(",", ".")),
            valorUnitario: Number(ln.valorUnitario.replace(",", ".")),
            desconto: Number(ln.desconto.replace(",", ".")),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      toast.success(`Documento #${data.nota?.sequencial} criado.`);
      setTomadorNome("");
      setTomadorDocumento("");
      setLines([
        { descricao: "Serviço / mensalidade", quantidade: "1", valorUnitario: "", desconto: "0" },
      ]);
      await load();
    } catch {
      toast.error("Falha ao criar documento.");
    }
  }

  async function emitir(id: string) {
    try {
      const res = await fetch(`/api/financeiro/notas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "EMITIDA" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Marcado como emitido (interno).");
      await load();
    } catch {
      toast.error("Falha ao atualizar.");
    }
  }

  async function solicitarEmissaoFiscal(id: string) {
    try {
      const res = await fetch(`/api/financeiro/notas/${id}/solicitar-emissao`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      if (data.webhook === "NOT_CONFIGURED") {
        toast.message("Webhook fiscal não configurado", {
          description:
            data.hint ??
            "Defina FISCAL_EMISSION_WEBHOOK_URL para enfileirar NFS-e/NF-e.",
        });
      } else {
        toast.success("Pedido enviado à fila fiscal.");
      }
      await load();
    } catch {
      toast.error("Falha ao solicitar emissão (webhook ou rede).");
    }
  }

  return (
    <div className="space-y-6 p-6">
      <p className="text-sm text-muted-foreground">
        Prefatura com linhas e PDF interno. Use “Solicitar emissão fiscal” para enviar o payload ao
        webhook configurado em produção (fila NFS-e/NF-e externa).
      </p>

      <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 space-y-3">
        <p className="text-sm font-medium">Novo documento</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            placeholder="Nome do tomador"
            value={tomadorNome}
            onChange={(e) => setTomadorNome(e.target.value)}
            className="rounded-xl"
          />
          <Input
            placeholder="CPF/CNPJ"
            value={tomadorDocumento}
            onChange={(e) => setTomadorDocumento(e.target.value)}
            className="rounded-xl"
          />
        </div>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="COBRANCA_ALUNO">Cobrança aluno</option>
          <option value="SERVICO_PROFESSOR">Serviço professor</option>
          <option value="OUTRO">Outro</option>
        </select>
        {lines.map((ln, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-4 border-t border-border/40 pt-3">
            <Input
              placeholder="Descrição"
              value={ln.descricao}
              onChange={(e) => {
                const next = [...lines];
                next[i] = { ...next[i], descricao: e.target.value };
                setLines(next);
              }}
              className="rounded-xl sm:col-span-2"
            />
            <Input
              placeholder="Qtd"
              value={ln.quantidade}
              onChange={(e) => {
                const next = [...lines];
                next[i] = { ...next[i], quantidade: e.target.value };
                setLines(next);
              }}
              className="rounded-xl"
            />
            <Input
              placeholder="Valor unit."
              value={ln.valorUnitario}
              onChange={(e) => {
                const next = [...lines];
                next[i] = { ...next[i], valorUnitario: e.target.value };
                setLines(next);
              }}
              className="rounded-xl"
            />
            <Input
              placeholder="Desconto linha"
              value={ln.desconto}
              onChange={(e) => {
                const next = [...lines];
                next[i] = { ...next[i], desconto: e.target.value };
                setLines(next);
              }}
              className="rounded-xl"
            />
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() =>
              setLines((x) => [
                ...x,
                { descricao: "", quantidade: "1", valorUnitario: "", desconto: "0" },
              ])
            }
          >
            + Linha
          </Button>
          <Button type="button" className="rounded-xl" onClick={() => void criar()}>
            Gerar rascunho
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/30 text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nº</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Tomador</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Fiscal</th>
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
                  <td className="px-4 py-3 tabular-nums">{r.sequencial}</td>
                  <td className="px-4 py-3">{r.tipo}</td>
                  <td className="px-4 py-3">{r.tomadorNome}</td>
                  <td className="px-4 py-3 tabular-nums">{String(r.total)}</td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {r.emissionRequestedAt ?
                      new Date(r.emissionRequestedAt).toLocaleString("pt-BR")
                    : "—"}
                  </td>
                  <td className="px-4 py-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="rounded-xl" asChild>
                      <a href={`/api/financeiro/notas/${r.id}/pdf`} target="_blank" rel="noreferrer">
                        PDF
                      </a>
                    </Button>
                    {r.status === "RASCUNHO" ?
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-xl"
                        type="button"
                        onClick={() => void emitir(r.id)}
                      >
                        Emitir (interno)
                      </Button>
                    : null}
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      type="button"
                      onClick={() => void solicitarEmissaoFiscal(r.id)}
                    >
                      Solicitar fiscal
                    </Button>
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
