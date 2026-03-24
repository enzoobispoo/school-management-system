"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible } from "@/components/ui/collapsible";
import { Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { TeacherScheduleList } from "@/components/professores/card/teacher-schedule-list";
import { TeacherCardActions } from "@/components/professores/card/teacher-card-actions";

interface Schedule {
  day: string;
  time: string;
  course: string;
  class: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  courses: string[];
  schedule: Schedule[];
  initials: string;
  active: boolean;
}

interface TeacherCardProps {
  teacher: Teacher;
  onEdit?: (teacher: Teacher) => void;
  onDelete?: (teacher: Teacher) => void;
  onView?: (teacher: Teacher) => void;
  onManageClasses?: (teacher: Teacher) => void;
}

export function TeacherCard({
  teacher,
  onEdit,
  onDelete,
  onView,
  onManageClasses,
}: TeacherCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card
      className={cn(
        "relative border-border/50 shadow-sm transition-all duration-300",
        teacher.active ? "hover:shadow-md" : "opacity-60 grayscale"
      )}
    >
      {!teacher.active ? (
        <div className="absolute bottom-3 right-3 z-10 rounded-md border border-destructive/20 bg-background/80 px-2 py-1 text-xs text-destructive backdrop-blur">
          Inativo
        </div>
      ) : null}

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-black/[0.04] text-sm font-medium text-black">
                  {teacher.initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold text-foreground">
                  {teacher.name}
                </h3>

                <div className="flex flex-wrap gap-1">
                  {teacher.courses.map((course) => (
                    <Badge
                      key={course}
                      variant="secondary"
                      className="text-xs font-normal"
                    >
                      {course}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <TeacherCardActions
              teacher={teacher}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              onManageClasses={onManageClasses}
            />
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="mb-3 flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              {teacher.email}
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              {teacher.phone}
            </div>
          </div>

          <TeacherScheduleList
            schedule={teacher.schedule}
            isOpen={isOpen}
            active={teacher.active}
          />
        </CardContent>
      </Collapsible>
    </Card>
  );
}
