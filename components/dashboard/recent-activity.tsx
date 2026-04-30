"use client";

interface ActivityItem {
  id: string;
  type: "enrollment" | "payment" | "new_student";
  name: string;
  description: string;
  time: string;
  initials: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  loading?: boolean;
}

function getTypeLabel(type: ActivityItem["type"]) {
  if (type === "enrollment") return "Matrícula";
  if (type === "payment") return "Pagamento";
  return "Aluno";
}

export function RecentActivity({
  activities,
  loading = false,
}: RecentActivityProps) {
  return (
    <div className="rounded-[24px] border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] text-card-foreground">
      
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Movimentações
        </p>

        <h3 className="text-[28px] font-semibold tracking-[-0.04em] text-foreground">
          Atividades recentes
        </h3>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">
          Carregando atividades...
        </div>
      ) : activities.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          Nenhuma atividade recente encontrada.
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 rounded-[24px] border border-border p-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-sm font-semibold text-foreground">
                {activity.initials}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {activity.name}
                    </p>

                    <p className="text-xs font-medium text-muted-foreground">
                      {getTypeLabel(activity.type)}
                    </p>
                  </div>

                  <span className="shrink-0 text-xs text-muted-foreground">
                    {activity.time}
                  </span>
                </div>

                <p className="text-sm leading-6 text-muted-foreground">
                  {activity.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}