"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PopularCoursesChartProps {
  courses?: Array<{
    name: string;
    students: number;
    percentage: number;
  }>;
}

export function PopularCoursesChart({
  courses = [],
}: PopularCoursesChartProps) {
  return (
    <Card className="rounded-[24px] border border-black/5 bg-white text-black shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-black dark:text-white">
          Cursos Mais Populares
        </CardTitle>

        <p className="text-sm text-black/42 dark:text-white/60">
          Ranking por número de alunos matriculados
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-col gap-4">
          {courses.map((course, index) => (
            <div key={course.name} className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-xs font-medium text-black/55 dark:bg-white/10 dark:text-white/60">
                    {index + 1}
                  </span>

                  <span className="truncate font-medium text-black dark:text-white">
                    {course.name}
                  </span>
                </div>

                <span className="shrink-0 text-black/45 dark:text-white/60">
                  {course.students} alunos
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-black/[0.06] dark:bg-white/10">
                <div
                  className="h-2 rounded-full bg-black dark:bg-white"
                  style={{ width: `${course.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}