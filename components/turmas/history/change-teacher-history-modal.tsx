"use client";

import { useEffect, useState } from "react";
import { Clock3, History, UserCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HistoryItem {
  id: string;
  dataInicio: string;
  dataFim: string | null;
  motivoTroca: string | null;
  observacoes: string | null;
  professor: {
    id: string;
    nome: string;
    email: string | null;
    telefone: string | null;
  };
}

interface ChangeTeacherHistoryModalProps {
  turmaId: string;
  turmaNome: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(date: string | null) {
  if (!date) return "Atual";
  return new Date(date).toLocaleDateString("pt-BR");
}

export function ChangeTeacherHistoryModal({
  turmaId,
  turmaNome,
  open,
  onOpenChange,
}: ChangeTeacherHistoryModalProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    async function fetchHistory() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/turmas/${turmaId}/historico-professores`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Não foi possível carregar o histórico.");
        }

        const result = await response.json();
        setItems(Array.isArray(result?.data) ? result.data : []);
      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar o histórico.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [open, turmaId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] rounded-[28px] border border-black/5 bg-white text-black shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-black dark:text-white">
            <History className="h-5 w-5" />
            Histórico de professores
          </DialogTitle>

          <DialogDescription className="text-black/42 dark:text-white/60">
            Veja as trocas já registradas na turma{" "}
            <strong>{turmaNome}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">Turma</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {turmaNome}
              </p>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                Carregando histórico...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                Nenhum histórico encontrado para esta turma.
              </div>
            ) : (
              <div className="space-y-0">
                {items.map((item, index) => {
                  const isCurrent = !item.dataFim;
                  const isLast = index === items.length - 1;

                  return (
                    <div
                      key={item.id}
                      className="relative flex gap-4 pb-6 last:pb-0"
                    >
                      <div className="relative flex w-5 justify-center">
                        <span
                          className={
                            isCurrent
                              ? "relative z-10 mt-1 h-3 w-3 rounded-full bg-green-500 ring-4 ring-green-500/15"
                              : "relative z-10 mt-1 h-3 w-3 rounded-full bg-muted-foreground/40 ring-4 ring-muted/40"
                          }
                        />

                        {!isLast ? (
                          <span className="absolute top-4 h-[calc(100%-0.25rem)] w-px bg-border" />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1 rounded-2xl border border-border/60 bg-card p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <UserCircle className="h-4 w-4 text-muted-foreground" />
                              <p className="truncate text-sm font-semibold text-foreground">
                                {item.professor.nome}
                              </p>
                            </div>

                            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock3 className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                              <span>
                                {formatDate(item.dataInicio)} -{" "}
                                {formatDate(item.dataFim)}
                              </span>
                            </div>
                          </div>

                          <span
                            className={
                              isCurrent
                                ? "rounded-full bg-green-500/10 px-2.5 py-1 text-[11px] font-medium text-green-700 dark:text-green-400"
                                : "rounded-full border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground"
                            }
                          >
                            {isCurrent ? "Atual" : "Histórico"}
                          </span>
                        </div>

                        {item.motivoTroca ? (
                          <div className="mt-4">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                              Motivo
                            </p>
                            <p className="mt-1 text-sm text-foreground">
                              {item.motivoTroca}
                            </p>
                          </div>
                        ) : null}

                        {item.observacoes ? (
                          <div className="mt-4">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                              Observações
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-foreground">
                              {item.observacoes}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}