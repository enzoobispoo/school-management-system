"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible } from "@/components/ui/collapsible";
import { Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { TurmaModal } from "@/components/cursos/turma-modal";
import { CourseCategoryBadge } from "@/components/cursos/card/course-category-badge";
import { CourseClassesList } from "@/components/cursos/card/course-classes-list";
import { CourseCardActions } from "@/components/cursos/card/course-card-actions";

interface CourseClass {
  name: string;
  schedule: string;
  teacher: string;
  students: number;
}

interface Course {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: string;
  active: boolean;
  studentsEnrolled: number;
  classes: CourseClass[];
}

interface CourseCardProps {
  course: Course;
  onRefresh?: () => Promise<void> | void;
  onEdit?: (course: Course) => void;
  onDelete?: (course: Course) => void;
  onViewStudents?: (course: Course) => void;
}

export function CourseCard({
  course,
  onRefresh,
  onEdit,
  onDelete,
  onViewStudents,
}: CourseCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openTurmaModal, setOpenTurmaModal] = useState(false);

  return (
    <>
      <Card
        className={cn(
          "relative border-border/50 shadow-sm transition-all duration-300",
          course.active ? "hover:shadow-md" : "opacity-60 grayscale"
        )}
      >
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {course.name}
                  </h3>

                  {!course.active ? (
                    <div className="absolute bottom-3 right-3 z-10 rounded-md border border-destructive/20 bg-background/80 px-2 py-1 text-xs text-destructive backdrop-blur">
                      Inativo
                    </div>
                  ) : null}

                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{course.studentsEnrolled} alunos</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end justify-start gap-2">
                <CourseCategoryBadge category={course.category} />

                <span className="mt-1 text-lg font-semibold text-foreground whitespace-nowrap">
                  R$ {course.price.toFixed(2).replace(".", ",")}
                </span>

                <CourseCardActions
                  course={course}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onViewStudents={onViewStudents}
                  onAddClass={() => setOpenTurmaModal(true)}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <CourseClassesList
              classes={course.classes}
              isOpen={isOpen}
              active={course.active}
            />
          </CardContent>
        </Collapsible>
      </Card>

      <TurmaModal
        open={openTurmaModal}
        onClose={() => setOpenTurmaModal(false)}
        cursoId={course.id}
        onSuccess={onRefresh}
      />
    </>
  );
}
