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
    <div className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="mb-6">
        <p className="text-sm text-black/45">Movimentações</p>
        <h3 className="text-[28px] font-semibold tracking-[-0.04em] text-black">
          Atividades recentes
        </h3>
      </div>

      {loading ? (
        <div className="text-sm text-black/45">Carregando atividades...</div>
      ) : activities.length === 0 ? (
        <div className="text-sm text-black/45">
          Nenhuma atividade recente encontrada.
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 rounded-[24px] border border-black/5 p-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white">
                {activity.initials}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-black">
                      {activity.name}
                    </p>
                    <p className="text-xs font-medium text-black/45">
                      {getTypeLabel(activity.type)}
                    </p>
                  </div>

                  <span className="shrink-0 text-xs text-black/40">
                    {activity.time}
                  </span>
                </div>

                <p className="text-sm leading-6 text-black/65">
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