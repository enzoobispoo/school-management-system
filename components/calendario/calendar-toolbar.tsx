"use client";

import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  SlidersHorizontal,
} from "lucide-react";

interface CalendarToolbarProps {
  title: string;
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
  onCreate: () => void;
  onOpenFilters: () => void;
  hasAdvancedFilters?: boolean;
}

export function CalendarToolbar({
  title,
  onPrev,
  onToday,
  onNext,
  onCreate,
  onOpenFilters,
  hasAdvancedFilters = false,
}: CalendarToolbarProps) {
  return (
    <div className="mb-6 rounded-[28px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <h2 className="break-words text-[24px] font-semibold tracking-[-0.03em] text-black sm:text-[28px]">
              {title}
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-2xl border-black/10 bg-white shadow-none"
                onClick={onPrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                className="h-11 flex-1 rounded-2xl border-black/10 bg-white px-4 shadow-none sm:flex-none"
                onClick={onToday}
              >
                Esta semana
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-2xl border-black/10 bg-white shadow-none"
                onClick={onNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                variant="outline"
                className={`h-11 w-full rounded-2xl border-black/10 bg-white px-4 shadow-none sm:w-auto ${
                  hasAdvancedFilters ? "border-black text-black" : ""
                }`}
                onClick={onOpenFilters}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                {hasAdvancedFilters ? "Filtros ativos" : "Filtro"}
              </Button>

              <Button
                className="h-11 w-full rounded-2xl bg-black px-5 text-white hover:bg-black/90 sm:w-auto"
                onClick={onCreate}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar evento
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}