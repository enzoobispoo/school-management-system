"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface InadimplenciaChartProps {
  data: Array<{
    vencimento: string;
    valor: number;
    status: string;
  }>;
}

export function InadimplenciaChart({ data }: InadimplenciaChartProps) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const chartData = useMemo(() => {
    const map = new Map<string, { atrasado: number; pendente: number }>();

    data.forEach((p) => {
      const d = new Date(p.vencimento);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const entry = map.get(key) ?? { atrasado: 0, pendente: 0 };
      if (p.status === "ATRASADO") entry.atrasado += p.valor;
      else entry.pendente += p.valor;
      map.set(key, entry);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, val]) => {
        const [, month] = key.split("-");
        return { month: MONTH_NAMES[parseInt(month) - 1], ...val };
      });
  }, [data]);

  const colors = isDark
    ? { grid: "rgba(255,255,255,0.08)", axis: "rgba(255,255,255,0.45)", atrasado: "#f87171", pendente: "#fbbf24", tooltipBg: "#111111", tooltipBorder: "rgba(255,255,255,0.10)" }
    : { grid: "rgba(0,0,0,0.08)", axis: "rgba(0,0,0,0.45)", atrasado: "#ef4444", pendente: "#f59e0b", tooltipBg: "#ffffff", tooltipBorder: "rgba(0,0,0,0.08)" };

  if (chartData.length === 0) return null;

  return (
    <Card className="rounded-[24px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:border-white/10 dark:bg-[#1a1a1a]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-black dark:text-white">
          Inadimplência por Mês
        </CardTitle>
        <p className="text-sm text-black/42 dark:text-white/60">
          Valores em aberto agrupados por vencimento
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="h-[260px]">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: colors.axis, fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: colors.axis, fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} dx={-10} />
                <Tooltip
                  contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
                  formatter={(value: number, name: string) => [
                    `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                    name === "atrasado" ? "Atrasado" : "Pendente",
                  ]}
                />
                <Bar dataKey="atrasado" fill={colors.atrasado} radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="pendente" fill={colors.pendente} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-3 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-sm text-black/42 dark:text-white/60">Atrasado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-500" />
            <span className="text-sm text-black/42 dark:text-white/60">Pendente</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
