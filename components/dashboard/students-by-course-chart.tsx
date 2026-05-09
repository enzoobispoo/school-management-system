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
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

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
  const { t } = useDashboardLanguage();
  const seriesLabel = t("chart.students.series");

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 text-card-foreground">
      <div className="mb-4">
        <p className="text-[13px] text-muted-foreground">{t("chart.students.eyebrow")}</p>
        <h3 className="mt-0.5 text-[15px] font-semibold tracking-tight text-foreground">
          {t("chart.students.title")}
        </h3>
      </div>

      {loading ? (
        <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
          {t("chart.students.loading")}
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
                formatter={(value: number) => [value, seriesLabel]}
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
