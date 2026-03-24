"use client";

import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface Schedule {
  day: string;
  time: string;
  course: string;
  class: string;
}

interface TeacherScheduleListProps {
  schedule: Schedule[];
  isOpen: boolean;
  active: boolean;
}

export function TeacherScheduleList({
  schedule,
  isOpen,
  active,
}: TeacherScheduleListProps) {
  return (
    <>
      <CollapsibleTrigger asChild disabled={!active}>
        <Button
          variant="ghost"
          disabled={!active}
          className="h-9 w-full justify-between px-3 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Ver horários</span>
          </div>

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
          {schedule.map((item, index) => (
            <div
              key={`${item.day}-${item.time}-${item.course}`}
              className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/50 p-3"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {item.day}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.time}
                </span>
              </div>

              <div className="flex flex-col items-end gap-0.5">
                <span className="text-sm text-foreground">{item.course}</span>
                <span className="text-xs text-muted-foreground">
                  {item.class}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </>
  );
}
