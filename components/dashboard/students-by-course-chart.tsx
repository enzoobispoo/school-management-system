"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface StudentsByCourseChartProps {
  data: Array<{
    curso: string;
    alunos: number;
  }>;
  loading?: boolean;
}

export function StudentsByCourseChart({
  data,
  loading = false,
}: StudentsByCourseChartProps) {
  return (
    <div className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]
                dark:border-border dark:bg-card dark:text-card-foreground">
      <div className="mb-6">
        <p className="text-sm text-black/42 dark:text-muted-foreground">
          Distribuição
        </p>

        <h3 className="text-[28px] font-semibold tracking-[-0.04em] text-black dark:text-foreground">
          Alunos por curso
        </h3>
      </div>

      {loading ? (
        <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
          Carregando gráfico...
        </div>
      ) : (
        <div className="h-[320px] text-foreground">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid
                stroke="color-mix(in srgb, currentColor 12%, transparent)"
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="curso"
                tick={{ fontSize: 12, fill: "oklch(0.58 0.01 260)" }}
                tickMargin={10}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{ fontSize: 12, fill: "oklch(0.58 0.01 260)" }}
                tickMargin={10}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                formatter={(value: number) => [value, "Alunos"]}
                contentStyle={{
                  borderRadius: 18,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  color: "var(--card-foreground)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                }}
                labelStyle={{
                  color: "var(--muted-foreground)",
                }}
              />

              <Bar
                dataKey="alunos"
                radius={[12, 12, 0, 0]}
                fill="currentColor"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
