"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
    <Card className="rounded-[24px] border border-black/[0.05] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-black">
          Cursos Mais Populares
        </CardTitle>
        <p className="text-sm text-black/50">
          Ranking por número de alunos matriculados
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-col gap-4">
          {courses.map((course, index) => (
            <div key={course.name} className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="font-medium text-foreground">{course.name}</span>
                </div>
                <span className="text-muted-foreground">
                  {course.students} alunos
                </span>
              </div>
              <Progress value={course.percentage} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}