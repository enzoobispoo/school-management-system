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

export function RevenueChart({
  data,
  loading = false,
}: RevenueChartProps) {
  return (
    <div className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="mb-6">
        <p className="text-sm text-black/45">Receita</p>
        <h3 className="text-[28px] font-semibold tracking-[-0.04em] text-black">
          Receita ao longo do tempo
        </h3>
      </div>

      {loading ? (
        <div className="flex h-[320px] items-center justify-center text-sm text-black/45">
          Carregando gráfico...
        </div>
      ) : (
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="receitaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="currentColor" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="currentColor" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "rgba(0,0,0,0.45)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(value) => `R$ ${value / 1000}k`}
                tick={{ fontSize: 12, fill: "rgba(0,0,0,0.45)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Receita"]}
                contentStyle={{
                  borderRadius: 18,
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                }}
              />
              <Area
                type="monotone"
                dataKey="receita"
                stroke="black"
                fill="url(#receitaFill)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}