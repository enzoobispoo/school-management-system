"use client";

import { Calendar, ChevronDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CourseClass {
  name: string;
  schedule: string;
  teacher: string;
  students: number;
}

interface CourseClassesListProps {
  classes: CourseClass[];
  isOpen: boolean;
  active: boolean;
}

export function CourseClassesList({
  classes,
  isOpen,
  active,
}: CourseClassesListProps) {
  return (
    <>
      <CollapsibleTrigger asChild disabled={!active}>
        <Button
          variant="ghost"
          disabled={!active}
          className="h-9 w-full justify-between px-3 text-sm text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>Ver turmas ({classes.length})</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-3">
        <div className="flex flex-col gap-2">
          {classes.map((classItem, index) => (
            <div
              key={`${classItem.name}-${classItem.teacher}`}
              className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/50 p-3"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {classItem.name}
                </span>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {classItem.schedule}
                  </div>

                  <span>Prof. {classItem.teacher}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{classItem.students}</span>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </>
  );
}
