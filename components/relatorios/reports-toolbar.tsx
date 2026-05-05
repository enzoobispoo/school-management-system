"use client";

import { useEffect, useState } from "react";
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
  onExport: () => void;
}

export function ReportsToolbar({
  year,
  setYear,
  category,
  setCategory,
  onExport,
}: ReportsToolbarProps) {
  const [categorias, setCategorias] = useState<string[]>([]);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

  useEffect(() => {
    fetch("/api/cursos?pageSize=100", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.data)) {
          const cats = [...new Set<string>(d.data.map((c: { categoria: string }) => c.categoria))];
          setCategorias(cats);
        }
      })
      .catch(() => {});
  }, []);

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
              {years.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11 w-[170px] rounded-2xl">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={onExport}
          className="h-11 rounded-2xl px-5 gap-2 bg-white text-black border border-black/10 shadow-sm hover:bg-black/[0.03] dark:bg-white/10 dark:text-white dark:border-white/10 dark:hover:bg-white/20 dark:backdrop-blur-md"
        >
          <Download className="h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>
    </DashboardSectionCard>
  );
}
