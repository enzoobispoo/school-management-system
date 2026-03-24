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
    <div className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="mb-6">
        <p className="text-sm text-black/45">Distribuição</p>
        <h3 className="text-[28px] font-semibold tracking-[-0.04em] text-black">
          Alunos por curso
        </h3>
      </div>

      {loading ? (
        <div className="flex h-[320px] items-center justify-center text-sm text-black/45">
          Carregando gráfico...
        </div>
      ) : (
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis
                dataKey="curso"
                tick={{ fontSize: 12, fill: "rgba(0,0,0,0.45)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "rgba(0,0,0,0.45)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [value, "Alunos"]}
                contentStyle={{
                  borderRadius: 18,
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                }}
              />
              <Bar
                dataKey="alunos"
                radius={[12, 12, 0, 0]}
                fill="black"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}