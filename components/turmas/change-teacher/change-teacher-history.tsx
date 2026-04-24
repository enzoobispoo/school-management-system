"use client";

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

interface ChangeTeacherHistoryProps {
  items: HistoryItem[];
  loading: boolean;
}

function formatDate(date: string | null) {
  if (!date) return "Atual";
  return new Date(date).toLocaleDateString("pt-BR");
}

export function ChangeTeacherHistory({
  items,
  loading,
}: ChangeTeacherHistoryProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-5">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Histórico de professores
        </p>
        <p className="text-xs text-muted-foreground">
          Acompanhe as trocas já realizadas nesta turma.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border/50 bg-background px-4 py-3 text-sm text-muted-foreground">
          Carregando histórico...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-background px-4 py-3 text-sm text-muted-foreground">
          Nenhum histórico encontrado.
        </div>
      ) : (
        <div className="space-y-0">
          {items.map((item, index) => {
            const isCurrent = !item.dataFim;
            const isLast = index === items.length - 1;

            return (
              <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
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

                <div className="min-w-0 flex-1 rounded-2xl border border-border/50 bg-background p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.professor.nome}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(item.dataInicio)} - {formatDate(item.dataFim)}
                      </p>
                    </div>

                    <span
                      className={
                        isCurrent
                          ? "rounded-full bg-green-500/10 px-2.5 py-1 text-[11px] font-medium text-green-700 dark:text-green-400"
                          : "rounded-full border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground"
                      }
                    >
                      {isCurrent ? "Professor atual" : "Histórico"}
                    </span>
                  </div>

                  {item.motivoTroca ? (
                    <div className="mt-4">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Motivo da troca
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
  );
}