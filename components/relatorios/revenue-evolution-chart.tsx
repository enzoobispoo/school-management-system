"use client";

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
  return (
    <Card className="rounded-[24px] border border-black/[0.05] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-black">
          Evolução da Receita
        </CardTitle>
        <p className="text-sm text-black/50">
          Comparativo ano atual vs. ano anterior
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.915 0.005 260)" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "oklch(0.485 0.01 260)", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "oklch(0.485 0.01 260)", fontSize: 12 }}
                tickFormatter={(value) => `R$${value / 1000}k`}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(1 0 0)",
                  border: "1px solid oklch(0.915 0.005 260)",
                  borderRadius: "12px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                }}
                labelStyle={{
                  color: "oklch(0.165 0.015 260)",
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
                stroke="oklch(0.22 0.01 255)"
                strokeWidth={2.2}
                dot={false}
                activeDot={{ r: 5, fill: "oklch(0.22 0.01 255)" }}
              />
              <Line
                type="monotone"
                dataKey="anterior"
                stroke="oklch(0.55 0.15 250)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 5, fill: "oklch(0.55 0.15 250)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-black" />
            <span className="text-sm text-black/50">Ano Atual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-chart-2" />
            <span className="text-sm text-black/50">Ano Anterior</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}