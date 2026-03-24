"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, SlidersHorizontal } from "lucide-react";

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
      <div className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-black">
              {title}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-2xl border-black/10 bg-white shadow-none"
              onClick={onPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="h-11 rounded-2xl border-black/10 bg-white px-4 shadow-none"
              onClick={onToday}
            >
              Esta semana
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-2xl border-black/10 bg-white shadow-none"
              onClick={onNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className={`h-11 rounded-2xl border-black/10 bg-white px-4 shadow-none ${
                hasAdvancedFilters ? "border-black text-black" : ""
              }`}
              onClick={onOpenFilters}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              {hasAdvancedFilters ? "Filtros ativos" : "Filtro"}
            </Button>

            <Button
              className="h-11 rounded-2xl bg-black px-5 text-white hover:bg-black/90"
              onClick={onCreate}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar evento
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}