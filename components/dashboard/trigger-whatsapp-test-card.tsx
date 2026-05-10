"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function showTriggerWhatsappTestUi() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENABLE_TRIGGER_WHATSAPP_TEST === "true"
  );
}

type Props = {
  /** Só exibir para perfis que já podem enviar cobrança (API usa assertBillingNotify). */
  allowBillingTest: boolean;
};

/**
 * Card temporário para validar Trigger.dev + fila + Twilio com cobrança real.
 */
export function TriggerWhatsappTestCard({ allowBillingTest }: Props) {
  const [loading, setLoading] = useState(false);
  const [lastRunId, setLastRunId] = useState<string | null>(null);
  const [paymentIdOverride, setPaymentIdOverride] = useState("");

  if (!showTriggerWhatsappTestUi() || !allowBillingTest) {
    return null;
  }

  async function runTest() {
    setLoading(true);
    setLastRunId(null);
    try {
      const res = await fetch("/api/dev/trigger-test/whatsapp-payment-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(paymentIdOverride.trim() ?
            { paymentId: paymentIdOverride.trim() }
          : {}),
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        runId?: string;
        paymentId?: string;
        taskId?: string;
        error?: string;
        code?: string;
      };

      if (!res.ok) {
        toast.error(data.error ?? "Falha ao disparar teste", {
          description: data.code ? `Código: ${data.code}` : undefined,
        });
        return;
      }

      setLastRunId(data.runId ?? null);
      toast.success("Task enfileirada no Trigger.dev", {
        description: `runId: ${data.runId ?? "—"} · pagamento: ${data.paymentId ?? "—"}`,
        duration: 12_000,
      });
    } catch (e) {
      toast.error("Erro de rede ao chamar o teste.", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-amber-500/35 bg-amber-500/5 p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
          <FlaskConical className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Teste Trigger.dev — WhatsApp (temporário)
            </p>
            <p className="text-xs text-muted-foreground">
              Dispara <code className="rounded bg-muted px-1">tasks.trigger(&quot;whatsapp.payment-reminder&quot;)</code> no
              servidor com uma cobrança{" "}
              <strong className="font-medium text-foreground">PENDENTE</strong> ou{" "}
              <strong className="font-medium text-foreground">ATRASADA</strong> que tenha telefone.
              Sem mock. Cooldown de 24h ignorado só neste endpoint (
              <code className="rounded bg-muted px-1">skipCooldown: true</code>).
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="grid flex-1 gap-1">
              <span className="text-[11px] text-muted-foreground">
                paymentId opcional (vazio = primeira cobrança elegível)
              </span>
              <Input
                value={paymentIdOverride}
                onChange={(e) => setPaymentIdOverride(e.target.value)}
                placeholder="cltxxxxx…"
                className="rounded-xl font-mono text-xs"
                disabled={loading}
              />
            </label>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-amber-500/40 hover:bg-amber-500/10"
              disabled={loading}
              onClick={() => void runTest()}
            >
              {loading ?
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enfileirando…
                </>
              : "Disparar task"}
            </Button>
          </div>
          {lastRunId ?
            <p className="text-[11px] text-muted-foreground">
              Último <span className="font-mono text-foreground">{lastRunId}</span> — conferir logs no dashboard Trigger.dev.
            </p>
          : null}
        </div>
      </div>
    </div>
  );
}
