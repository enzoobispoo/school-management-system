"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface StudentsGrowthChartProps {
  data?: Array<{
    month: string;
    novos: number;
    cancelados: number;
  }>;
}

export function StudentsGrowthChart({
  data = [],
}: StudentsGrowthChartProps) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);

    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const colors = useMemo(
    () =>
      isDark
        ? {
            grid: "rgba(255,255,255,0.08)",
            axis: "rgba(255,255,255,0.45)",
            tooltipBg: "#111111",
            tooltipBorder: "rgba(255,255,255,0.10)",
            tooltipLabel: "rgba(255,255,255,0.55)",
            novos: "#ffffff",
            cancelados: "rgba(255,255,255,0.55)",
          }
        : {
            grid: "rgba(0,0,0,0.08)",
            axis: "rgba(0,0,0,0.45)",
            tooltipBg: "#ffffff",
            tooltipBorder: "rgba(0,0,0,0.08)",
            tooltipLabel: "rgba(0,0,0,0.55)",
            novos: "#111111",
            cancelados: "rgba(0,0,0,0.45)",
          },
    [isDark]
  );

  return (
    <Card className="rounded-[24px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:border-white/10 dark:bg-[#1a1a1a]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-black dark:text-white">
          Crescimento de Alunos
        </CardTitle>
        <p className="text-sm text-black/42 dark:text-white/60">
          Novos alunos vs. cancelamentos por mês
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="h-[300px]">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colors.grid}
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: colors.axis, fontSize: 12 }}
                  dy={10}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: colors.axis, fontSize: 12 }}
                  dx={-10}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.tooltipBg,
                    border: `1px solid ${colors.tooltipBorder}`,
                    borderRadius: "12px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    color: isDark ? "#ffffff" : "#111111",
                  }}
                  labelStyle={{
                    color: colors.tooltipLabel,
                    fontWeight: 500,
                  }}
                  formatter={(value: number, name: string) => [
                    value,
                    name === "novos" ? "Novos Alunos" : "Cancelamentos",
                  ]}
                />

                <Bar
                  dataKey="novos"
                  fill={colors.novos}
                  radius={[4, 4, 0, 0]}
                />

                <Bar
                  dataKey="cancelados"
                  fill={colors.cancelados}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-black dark:bg-white" />
            <span className="text-sm text-black/42 dark:text-white/60">
              Novos Alunos
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-black/40 dark:bg-white/50" />
            <span className="text-sm text-black/42 dark:text-white/60">
              Cancelamentos
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}