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

type Prof = {
  id: string;
  nome: string;
  email: string | null;
  ativo: boolean;
  turmasAtivas: number;
  perfil: {
    regime: string;
    situacao: string;
    documento: string | null;
    valorReferenciaMensal: unknown;
  } | null;
};

const REGIMES = ["CLT", "PJ", "AUTONOMO", "ESTAGIO", "OUTRO"] as const;
const SITUACOES = ["REGULAR", "PENDENCIA_DOCUMENTACAO", "INATIVO"] as const;

export function FinanceiroProfessoresClient() {
  const [rows, setRows] = useState<Prof[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<Prof | null>(null);
  const [form, setForm] = useState({
    regime: "CLT",
    situacao: "REGULAR",
    documento: "",
    chavePix: "",
    valorReferenciaMensal: "",
    dataAdmissao: "",
    observacoes: "",
  });
  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({
    competenciaMes: String(new Date().getMonth() + 1),
    competenciaAno: String(new Date().getFullYear()),
    valorBruto: "",
    descontos: "0",
    status: "RASCUNHO",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/financeiro/professores-financeiro", {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      setRows(data.professores ?? []);
    } catch {
      toast.error("Não foi possível carregar professores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openProfile(p: Prof) {
    setSel(p);
    const pf = p.perfil;
    setForm({
      regime: pf?.regime ?? "CLT",
      situacao: pf?.situacao ?? "REGULAR",
      documento: pf?.documento ?? "",
      chavePix: "",
      valorReferenciaMensal:
        pf?.valorReferenciaMensal != null ? String(pf.valorReferenciaMensal) : "",
      dataAdmissao: "",
      observacoes: "",
    });
    setOpen(true);
  }

  async function saveProfile() {
    if (!sel) return;
    try {
      const res = await fetch(`/api/financeiro/professores-financeiro/${sel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regime: form.regime,
          situacao: form.situacao,
          documento: form.documento || null,
          chavePix: form.chavePix || null,
          valorReferenciaMensal:
            form.valorReferenciaMensal ?
              Number(form.valorReferenciaMensal.replace(",", "."))
            : null,
          dataAdmissao: form.dataAdmissao || null,
          observacoes: form.observacoes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      toast.success("Perfil financeiro salvo.");
      setOpen(false);
      await load();
    } catch {
      toast.error("Falha ao salvar perfil.");
    }
  }

  function openPay(p: Prof) {
    setSel(p);
    setPayOpen(true);
  }

  async function savePayment() {
    if (!sel) return;
    try {
      const res = await fetch(
        `/api/financeiro/professores-financeiro/${sel.id}/pagamentos`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            competenciaMes: Number(payForm.competenciaMes),
            competenciaAno: Number(payForm.competenciaAno),
            valorBruto: Number(payForm.valorBruto.replace(",", ".")),
            descontos: Number(payForm.descontos.replace(",", ".")),
            status: payForm.status,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      toast.success("Pagamento registrado.");
      setPayOpen(false);
      await load();
    } catch {
      toast.error("Falha ao registrar pagamento.");
    }
  }

  return (
    <div className="space-y-4 p-6">
      <p className="text-sm text-muted-foreground">
        Cadastro interno para regime (CLT/PJ), referência de valor e histórico de repasses. Não
        substitui folha de pagamento ou obrigações trabalhistas.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/30 text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Professor</th>
              <th className="px-4 py-3">Turmas ativas</th>
              <th className="px-4 py-3">Regime</th>
              <th className="px-4 py-3">Situação</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ?
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Carregando…
                </td>
              </tr>
            : rows.map((r) => (
                <tr key={r.id} className="border-b border-border/40">
                  <td className="px-4 py-3 font-medium">{r.nome}</td>
                  <td className="px-4 py-3 tabular-nums">{r.turmasAtivas}</td>
                  <td className="px-4 py-3">{r.perfil?.regime ?? "—"}</td>
                  <td className="px-4 py-3">{r.perfil?.situacao ?? "—"}</td>
                  <td className="px-4 py-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      type="button"
                      onClick={() => openProfile(r)}
                    >
                      Perfil
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-xl"
                      type="button"
                      onClick={() => openPay(r)}
                    >
                      Pagamento
                    </Button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Perfil financeiro</DialogTitle>
          </DialogHeader>
          {sel ?
            <div className="grid gap-3 text-sm">
              <p className="font-medium">{sel.nome}</p>
              <label className="grid gap-1">
                <span className="text-xs text-muted-foreground">Regime</span>
                <select
                  value={form.regime}
                  onChange={(e) => setForm((f) => ({ ...f, regime: e.target.value }))}
                  className="rounded-xl border border-input bg-background px-3 py-2"
                >
                  {REGIMES.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-muted-foreground">Situação</span>
                <select
                  value={form.situacao}
                  onChange={(e) => setForm((f) => ({ ...f, situacao: e.target.value }))}
                  className="rounded-xl border border-input bg-background px-3 py-2"
                >
                  {SITUACOES.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                placeholder="CPF / CNPJ"
                value={form.documento}
                onChange={(e) => setForm((f) => ({ ...f, documento: e.target.value }))}
                className="rounded-xl"
              />
              <Input
                placeholder="Chave PIX"
                value={form.chavePix}
                onChange={(e) => setForm((f) => ({ ...f, chavePix: e.target.value }))}
                className="rounded-xl"
              />
              <Input
                placeholder="Valor referência mensal"
                value={form.valorReferenciaMensal}
                onChange={(e) =>
                  setForm((f) => ({ ...f, valorReferenciaMensal: e.target.value }))
                }
                className="rounded-xl"
              />
              <Input
                type="date"
                value={form.dataAdmissao}
                onChange={(e) => setForm((f) => ({ ...f, dataAdmissao: e.target.value }))}
                className="rounded-xl"
              />
              <textarea
                placeholder="Observações"
                value={form.observacoes}
                onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                rows={2}
                className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
              <Button type="button" className="rounded-xl" onClick={() => void saveProfile()}>
                Salvar
              </Button>
            </div>
          : null}
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Lançar pagamento ao professor</DialogTitle>
          </DialogHeader>
          {sel ?
            <div className="grid gap-2 text-sm">
              <p className="text-muted-foreground">{sel.nome}</p>
              <Input
                placeholder="Mês (1-12)"
                value={payForm.competenciaMes}
                onChange={(e) =>
                  setPayForm((f) => ({ ...f, competenciaMes: e.target.value }))
                }
                className="rounded-xl"
              />
              <Input
                placeholder="Ano"
                value={payForm.competenciaAno}
                onChange={(e) =>
                  setPayForm((f) => ({ ...f, competenciaAno: e.target.value }))
                }
                className="rounded-xl"
              />
              <Input
                placeholder="Valor bruto"
                value={payForm.valorBruto}
                onChange={(e) =>
                  setPayForm((f) => ({ ...f, valorBruto: e.target.value }))
                }
                className="rounded-xl"
              />
              <Input
                placeholder="Descontos"
                value={payForm.descontos}
                onChange={(e) =>
                  setPayForm((f) => ({ ...f, descontos: e.target.value }))
                }
                className="rounded-xl"
              />
              <select
                value={payForm.status}
                onChange={(e) =>
                  setPayForm((f) => ({ ...f, status: e.target.value }))
                }
                className="rounded-xl border border-input bg-background px-3 py-2"
              >
                <option value="RASCUNHO">RASCUNHO</option>
                <option value="APROVADO">APROVADO</option>
                <option value="PAGO">PAGO</option>
                <option value="CANCELADO">CANCELADO</option>
              </select>
              <Button type="button" className="rounded-xl" onClick={() => void savePayment()}>
                Salvar
              </Button>
            </div>
          : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
