"use client";

import { useEffect, useState } from "react";
import { CalendarEvent } from "@/lib/calendario/calendar-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CalendarDays,
  Clock3,
  GraduationCap,
  MapPin,
  User,
  Users,
} from "lucide-react";
import { getEventColorVars, getEventTypeLabel } from "@/lib/calendario/calendar-utils";

interface CalendarEventDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}

export function CalendarEventDetailsModal({
  open,
  onOpenChange,
  event,
  onEdit,
  onDelete,
  deleting = false,
}: CalendarEventDetailsModalProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  function getBadgeStyle(ev: CalendarEvent) {
    const vars = getEventColorVars(ev) as Record<string, string>;
    return {
      backgroundColor: isDark ? vars["--ev-bg-dark"] : vars["--ev-bg-light"],
      borderColor: isDark ? vars["--ev-border-dark"] : vars["--ev-border-light"],
      color: isDark ? vars["--ev-text-dark"] : vars["--ev-text-light"],
    };
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-[28px] border border-border bg-card p-0 text-card-foreground shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:max-w-[640px]">
        {event && (
          <>
            <DialogHeader className="border-b border-border bg-card px-7 py-6 text-left">
              <div className="flex items-start justify-between gap-4 pr-8">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full border px-3 py-1 text-xs font-medium"
                      style={getBadgeStyle(event)}
                    >
                      {getEventTypeLabel(event)}
                    </span>

                    {event.source === "automatic" && (
                      <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        Automático
                      </span>
                    )}
                  </div>

                  <DialogTitle className="text-[26px] font-semibold tracking-[-0.03em] text-foreground">
                    {event.title}
                  </DialogTitle>

                  <DialogDescription className="mt-2 text-sm text-muted-foreground">
                    Detalhes do evento selecionado
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 px-7 py-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-muted/40 p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Data</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(event.start).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/40 p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Horário</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(event.start).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    {" - "}
                    {new Date(event.end).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              {event.description && (
                <div className="rounded-2xl border border-border p-5">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Descrição</p>
                  <p className="text-sm leading-6 text-foreground">{event.description}</p>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                {event.professor && (
                  <div className="rounded-2xl border border-border p-5">
                    <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Professor</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{event.professor.nome}</p>
                  </div>
                )}

                {event.turma && (
                  <div className="rounded-2xl border border-border p-5">
                    <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Turma</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{event.turma.nome}</p>
                  </div>
                )}

                {event.curso && (
                  <div className="rounded-2xl border border-border p-5">
                    <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Curso</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{event.curso.nome}</p>
                  </div>
                )}

                {event.location && (
                  <div className="rounded-2xl border border-border p-5">
                    <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Local</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{event.location}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 border-t border-border bg-card px-7 py-5">
              <Button
                variant="outline"
                className="h-11 flex-1 rounded-2xl border-border bg-background/60 hover:bg-accent"
                disabled={event.source === "automatic"}
                onClick={onEdit}
              >
                Editar
              </Button>

              <Button
                variant="destructive"
                className="h-11 flex-1 rounded-2xl"
                disabled={event.source === "automatic" || deleting}
                onClick={onDelete}
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </Button>

              {event.source === "automatic" && (
                <p className="w-full text-center text-xs text-muted-foreground">
                  Eventos automáticos não podem ser editados ou excluídos.
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
