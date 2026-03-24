"use client";

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

interface CalendarEventDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}

function getEventTypeLabel(event: CalendarEvent) {
  if (event.source === "automatic") return "Aula";

  switch (event.type) {
    case "REUNIAO":
      return "Reunião";
    case "PROVA":
      return "Prova";
    case "REPOSICAO":
      return "Reposição";
    case "FERIADO":
      return "Feriado";
    case "LEMBRETE":
      return "Lembrete";
    default:
      return "Geral";
  }
}

function getEventBadgeClasses(event: CalendarEvent) {
  if (event.source === "automatic") {
    return "border-[#cfd7ff] bg-[#e9ecff] text-[#2d3553]";
  }

  switch (event.type) {
    case "REUNIAO":
      return "border-[#d9c8ff] bg-[#f1e9ff] text-[#4b3f66]";
    case "PROVA":
      return "border-[#d7dcff] bg-[#e8ebff] text-[#404b6b]";
    case "FERIADO":
      return "border-[#ffd5cd] bg-[#ffe8e3] text-[#6b4c46]";
    case "REPOSICAO":
      return "border-[#cdeed7] bg-[#e5f8ea] text-[#3d5e48]";
    case "LEMBRETE":
      return "border-[#e5e7eb] bg-[#f5f5f5] text-[#3f3f46]";
    default:
      return "border-[#e5e7eb] bg-[#f5f5f5] text-[#3f3f46]";
  }
}

export function CalendarEventDetailsModal({
  open,
  onOpenChange,
  event,
  onEdit,
  onDelete,
  deleting = false,
}: CalendarEventDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-[28px] border border-black/5 bg-white p-0 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:max-w-[640px]">
        {event && (
          <>
            <DialogHeader className="border-b border-black/5 bg-[#fafafa] px-7 py-6 text-left">
              <div className="flex items-start justify-between gap-4 pr-8">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${getEventBadgeClasses(
                        event
                      )}`}
                    >
                      {getEventTypeLabel(event)}
                    </span>

                    {event.source === "automatic" && (
                      <span className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                        Automático
                      </span>
                    )}
                  </div>

                  <DialogTitle className="text-[26px] font-semibold tracking-[-0.03em] text-black">
                    {event.title}
                  </DialogTitle>

                  <DialogDescription className="mt-2 text-sm text-[#6b7280]">
                    Detalhes do evento selecionado
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 px-7 py-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#f7f7f8] p-4">
                  <div className="mb-2 flex items-center gap-2 text-[#6b7280]">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      Data
                    </span>
                  </div>
                  <p className="text-sm font-medium text-black">
                    {new Date(event.start).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f7f8] p-4">
                  <div className="mb-2 flex items-center gap-2 text-[#6b7280]">
                    <Clock3 className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      Horário
                    </span>
                  </div>
                  <p className="text-sm font-medium text-black">
                    {new Date(event.start).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(event.end).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {event.description && (
                <div className="rounded-2xl border border-black/5 p-5">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Descrição
                  </p>
                  <p className="text-sm leading-6 text-black">
                    {event.description}
                  </p>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                {event.professor && (
                  <div className="rounded-2xl border border-black/5 p-5">
                    <div className="mb-2 flex items-center gap-2 text-[#6b7280]">
                      <User className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Professor
                      </span>
                    </div>
                    <p className="text-sm font-medium text-black">
                      {event.professor.nome}
                    </p>
                  </div>
                )}

                {event.turma && (
                  <div className="rounded-2xl border border-black/5 p-5">
                    <div className="mb-2 flex items-center gap-2 text-[#6b7280]">
                      <Users className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Turma
                      </span>
                    </div>
                    <p className="text-sm font-medium text-black">
                      {event.turma.nome}
                    </p>
                  </div>
                )}

                {event.curso && (
                  <div className="rounded-2xl border border-black/5 p-5">
                    <div className="mb-2 flex items-center gap-2 text-[#6b7280]">
                      <GraduationCap className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Curso
                      </span>
                    </div>
                    <p className="text-sm font-medium text-black">
                      {event.curso.nome}
                    </p>
                  </div>
                )}

                {event.location && (
                  <div className="rounded-2xl border border-black/5 p-5">
                    <div className="mb-2 flex items-center gap-2 text-[#6b7280]">
                      <MapPin className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Local
                      </span>
                    </div>
                    <p className="text-sm font-medium text-black">
                      {event.location}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 border-t border-black/5 bg-[#fafafa] px-7 py-5">
              <Button
                variant="outline"
                className="h-11 flex-1 rounded-2xl border-black/10"
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
                Excluir
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}