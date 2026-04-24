"use client";

import { Download, Calendar } from "lucide-react";
import { DashboardSectionCard } from "@/components/dashboard/ui/dashboard-section-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReportsToolbarProps {
  year: string;
  setYear: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
}

export function ReportsToolbar({
  year,
  setYear,
  category,
  setCategory,
}: ReportsToolbarProps) {
  return (
    <DashboardSectionCard className="mb-6 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Período:</span>
          </div>

          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-11 w-[120px] rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11 w-[170px] rounded-2xl">
              <SelectValue placeholder="Curso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cursos</SelectItem>
              <SelectItem value="Idiomas">Idiomas</SelectItem>
              <SelectItem value="Música">Música</SelectItem>
              <SelectItem value="Tecnologia">Tecnologia</SelectItem>
              <SelectItem value="Educação">Educação</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          className="
    h-11 rounded-2xl px-5 gap-2

    bg-white text-black border border-black/10 shadow-sm
    hover:bg-black/[0.03]

    dark:bg-white/10 dark:text-white
    dark:border-white/10 dark:hover:bg-white/20
    dark:backdrop-blur-md
  "
        >
          <Download className="h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>
    </DashboardSectionCard>
  );
}
