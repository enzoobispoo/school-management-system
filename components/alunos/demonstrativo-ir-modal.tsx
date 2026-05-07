"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Meta = {
  nomeDestinatario: string;
  email: string | null;
  telefone: string | null;
  hasEmail: boolean;
  hasWhatsApp: boolean;
};

interface DemonstrativoIrModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alunoId: string;
  alunoNome: string;
  /** Anos pré-marcados ao abrir (ex.: ano da linha no financeiro). */
  initialSelectedYears?: number[];
}

export function DemonstrativoIrModal({
  open,
  onOpenChange,
  alunoId,
  alunoNome,
  initialSelectedYears,
}: DemonstrativoIrModalProps) {
  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 8 }, (_, i) => y - i);
  }, []);

  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set());
  const [sendEmail, setSendEmail] = useState(false);
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingMeta(true);
    fetch(`/api/alunos/${alunoId}/demonstrativo-ir/meta`, { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Erro ao carregar contatos");
        setMeta(data as Meta);
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Erro ao carregar contatos");
        setMeta(null);
      })
      .finally(() => setLoadingMeta(false));
  }, [open, alunoId]);

  useEffect(() => {
    if (!open) return;
    const pre = initialSelectedYears?.filter((y) => yearOptions.includes(y)) ?? [];
    const fallback = yearOptions[1] ?? yearOptions[0];
    const initial = pre.length > 0 ? pre : [fallback];
    setSelectedYears(new Set(initial));
    setSendEmail(false);
    setSendWhatsApp(false);
  }, [open, alunoId, initialSelectedYears, yearOptions]);

  function toggleYear(y: number) {
    setSelectedYears((prev) => {
      const next = new Set(prev);
      if (next.has(y)) next.delete(y);
      else next.add(y);
      return next;
    });
  }

  async function handleDownload() {
    const anos = [...selectedYears].sort((a, b) => a - b);
    if (anos.length === 0) {
      toast.error("Selecione pelo menos um ano-calendário.");
      return;
    }
    setDownloading(true);
    try {
      const res = await fetch(
        `/api/alunos/${alunoId}/demonstrativo-ir?anos=${anos.join(",")}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Falha ao gerar PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `demonstrativo-ir-${anos.join("-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(
        anos.length > 1 ? "PDFs mesclados baixados." : "Demonstrativo baixado."
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao baixar");
    } finally {
      setDownloading(false);
    }
  }

  async function handleSend() {
    const anos = [...selectedYears].sort((a, b) => a - b);
    if (anos.length === 0) {
      toast.error("Selecione pelo menos um ano-calendário.");
      return;
    }
    if (!sendEmail && !sendWhatsApp) {
      toast.error("Marque e-mail e/ou WhatsApp para enviar.");
      return;
    }
    if (sendEmail && !meta?.hasEmail) {
      toast.error("Cadastre um e-mail do aluno ou responsável.");
      return;
    }
    if (sendWhatsApp && !meta?.hasWhatsApp) {
      toast.error("Cadastre um telefone do aluno ou responsável.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/alunos/${alunoId}/demonstrativo-ir/enviar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          anos,
          sendEmail,
          sendWhatsApp,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Falha ao enviar");
      }
      const parts: string[] = [];
      if ((data as { emailSent?: boolean }).emailSent) parts.push("e-mail");
      if ((data as { whatsappSent?: boolean }).whatsappSent) parts.push("WhatsApp");
      toast.success(`Enviado por ${parts.join(" e ")}.`);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-[28px]">
        <DialogHeader>
          <DialogTitle>Demonstrativo IR</DialogTitle>
          <DialogDescription>
            Escolha os anos-calendário e, se quiser, envie ao responsável. PDFs listam apenas
            pagamentos quitados com data registrada em cada ano.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm font-medium text-foreground">{alunoNome}</p>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Anos-calendário</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {yearOptions.map((y) => (
                <label
                  key={y}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm"
                >
                  <Checkbox
                    checked={selectedYears.has(y)}
                    onCheckedChange={() => toggleYear(y)}
                  />
                  <span>{y}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-border/50 bg-muted/15 p-3">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Enviar ao responsável
            </Label>

            {loadingMeta ? (
              <p className="text-xs text-muted-foreground">Carregando contatos…</p>
            ) : meta ? (
              <div className="space-y-2 text-xs text-muted-foreground">
                {meta.hasEmail ? (
                  <p>E-mail: {meta.email}</p>
                ) : (
                  <p className="text-amber-700 dark:text-amber-400">
                    Sem e-mail cadastrado — envio por e-mail indisponível.
                  </p>
                )}
                {meta.hasWhatsApp ? (
                  <p>WhatsApp: {meta.telefone}</p>
                ) : (
                  <p className="text-amber-700 dark:text-amber-400">
                    Sem telefone cadastrado — WhatsApp indisponível.
                  </p>
                )}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={sendEmail}
                  onCheckedChange={(v) => setSendEmail(v === true)}
                  disabled={!meta?.hasEmail}
                />
                <span>Enviar PDF(s) por e-mail</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={sendWhatsApp}
                  onCheckedChange={(v) => setSendWhatsApp(v === true)}
                  disabled={!meta?.hasWhatsApp}
                />
                <span>Enviar resumo por WhatsApp</span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => onOpenChange(false)}
            disabled={downloading || sending}
          >
            Fechar
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="rounded-2xl"
            disabled={downloading || sending || selectedYears.size === 0}
            onClick={handleDownload}
          >
            {downloading ? "Baixando…" : "Baixar PDF"}
          </Button>
          <Button
            type="button"
            className="rounded-2xl"
            disabled={
              sending ||
              downloading ||
              selectedYears.size === 0 ||
              (!sendEmail && !sendWhatsApp)
            }
            onClick={handleSend}
          >
            {sending ? "Enviando…" : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
