"use client";

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
  return (
    <Card className="rounded-[24px] border border-black/[0.05] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-black">
          Crescimento de Alunos
        </CardTitle>
        <p className="text-sm text-black/50">
          Novos alunos vs. cancelamentos por mês
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.915 0.005 260)"
                vertical={false}
              />
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
                  value,
                  name === "novos" ? "Novos Alunos" : "Cancelamentos",
                ]}
              />
              <Bar
                dataKey="novos"
                fill="oklch(0.22 0.01 255)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="cancelados"
                fill="oklch(0.577 0.245 27.325)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-black" />
            <span className="text-sm text-black/50">Novos Alunos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span className="text-sm text-black/50">Cancelamentos</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}