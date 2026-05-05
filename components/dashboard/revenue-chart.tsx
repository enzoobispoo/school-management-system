"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface RevenueChartProps {
  data: Array<{
    month: string;
    receita: number;
  }>;
  loading?: boolean;
}

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function RevenueChart({ data, loading = false }: RevenueChartProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="mb-4">
        <p className="text-[13px] text-muted-foreground">Receita</p>
        <h3 className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">
          Receita ao longo do tempo
        </h3>
      </div>

      {loading ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
          Carregando...
        </div>
      ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="receitaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="currentColor" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />

              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickMargin={8}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tickFormatter={(value) => `R$ ${value / 1000}k`}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickMargin={8}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Receita"]}
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  color: "var(--foreground)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                  fontSize: 13,
                }}
                labelStyle={{ color: "var(--muted-foreground)" }}
              />

              <Area
                type="monotone"
                dataKey="receita"
                stroke="var(--foreground)"
                fill="url(#receitaFill)"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}