"use client";

import { useEffect, useState } from "react";

type EnvioItem = {
  id: string;
  canal: "WHATSAPP" | "EMAIL" | "SMS" | "SISTEMA";
  tipo: "BOLETO" | "LEMBRETE" | "COBRANCA_ATRASO";
  destino: string;
  status: "PENDENTE" | "ENVIADO" | "FALHO";
  provedor?: string | null;
  externalId?: string | null;
  mensagem?: string | null;
  erro?: string | null;
  createdAt: string;
};

interface PaymentSendHistoryProps {
  paymentId: string;
}

function getTipoLabel(tipo: EnvioItem["tipo"]) {
  switch (tipo) {
    case "BOLETO":
      return "Boleto";
    case "LEMBRETE":
      return "Lembrete";
    case "COBRANCA_ATRASO":
      return "Cobrança";
    default:
      return "Envio";
  }
}

function getStatusLabel(status: EnvioItem["status"]) {
  switch (status) {
    case "ENVIADO":
      return "enviado";
    case "FALHO":
      return "falhou";
    case "PENDENTE":
      return "pendente";
    default:
      return "status";
  }
}

function getStatusClasses(status: EnvioItem["status"]) {
  switch (status) {
    case "ENVIADO":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300";
    case "FALHO":
      return "border border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300";
    case "PENDENTE":
      return "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300";
    default:
      return "border border-black/10 bg-black/[0.03] text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70";
  }
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PaymentSendHistory({
  paymentId,
}: PaymentSendHistoryProps) {
  const [items, setItems] = useState<EnvioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/pagamentos/${paymentId}/envios`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Falha ao carregar histórico.");
        }

        const result = await response.json();

        if (active) {
          setItems(result.data || []);
        }
      } catch (err) {
        console.error(err);

        if (active) {
          setError("Não foi possível carregar o histórico de envios.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [paymentId]);

  return (
    <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-black dark:text-white">
          Histórico de envio
        </h3>
        <p className="text-sm text-black/60 dark:text-white/60">
          Últimas tentativas e envios realizados para este pagamento.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-black/60 dark:text-white/60">
          Carregando histórico...
        </div>
      ) : error ? (
        <div className="text-sm text-red-600 dark:text-red-300">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-black/60 dark:text-white/60">
          Nenhum envio registrado para este pagamento.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const label = `${getTipoLabel(item.tipo)} ${getStatusLabel(item.status)}`;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-black/5 bg-white p-3 dark:border-white/10 dark:bg-[#111111]"
              >
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-medium text-black dark:text-white">
                    {formatDateTime(item.createdAt)}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClasses(item.status)}`}
                    >
                      {label}
                    </span>

                    <span className="text-[10px] uppercase tracking-wide text-black/45 dark:text-white/45">
                      {item.canal}
                    </span>
                  </div>

                  <div className="text-xs text-black/65 dark:text-white/65">
                    <span className="text-black/85 dark:text-white/85">
                      Destino:
                    </span>{" "}
                    {item.destino}
                  </div>

                  {item.erro ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                      {item.erro}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}