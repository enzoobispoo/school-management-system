"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface RevenueEvolutionChartProps {
  data?: Array<{
    month: string;
    atual: number;
    anterior: number;
  }>;
}

export function RevenueEvolutionChart({
  data = [],
}: RevenueEvolutionChartProps) {
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
            atual: "#ffffff",
            anterior: "rgba(255,255,255,0.55)",
          }
        : {
            grid: "rgba(0,0,0,0.08)",
            axis: "rgba(0,0,0,0.45)",
            tooltipBg: "#ffffff",
            tooltipBorder: "rgba(0,0,0,0.08)",
            tooltipLabel: "rgba(0,0,0,0.55)",
            atual: "#111111",
            anterior: "rgba(0,0,0,0.45)",
          },
    [isDark]
  );

  return (
    <Card className="rounded-[24px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:border-white/10 dark:bg-[#1a1a1a]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-black dark:text-white">
          Evolução da Receita
        </CardTitle>
        <p className="text-sm text-black/42 dark:text-white/60">
          Comparativo ano atual vs. ano anterior
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="h-[300px]">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />

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
                  tickFormatter={(value) => `R$${value / 1000}k`}
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
                    `R$ ${value.toLocaleString("pt-BR")}`,
                    name === "atual" ? "Ano Atual" : "Ano Anterior",
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="atual"
                  stroke={colors.atual}
                  strokeWidth={2.2}
                  dot={false}
                  activeDot={{ r: 5, fill: colors.atual }}
                />

                <Line
                  type="monotone"
                  dataKey="anterior"
                  stroke={colors.anterior}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 5, fill: colors.anterior }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-black dark:bg-white" />
            <span className="text-sm text-black/42 dark:text-white/60">
              Ano Atual
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-black/40 dark:bg-white/50" />
            <span className="text-sm text-black/42 dark:text-white/60">
              Ano Anterior
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}