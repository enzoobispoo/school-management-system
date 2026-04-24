"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const categoryStyles: Record<string, string> = {
  Idiomas: "border-chart-2/20 bg-chart-2/10 text-chart-2",
  Música: "border-chart-3/20 bg-chart-3/10 text-chart-3",
  Tecnologia: "border-chart-1/20 bg-chart-1/10 text-chart-1",
  Educação: "border-chart-4/20 bg-chart-4/10 text-chart-4",
};

interface CourseCategoryBadgeProps {
  category: string;
}

export function CourseCategoryBadge({
  category,
}: CourseCategoryBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-normal",
        categoryStyles[category] || "bg-muted text-muted-foreground"
      )}
    >
      {category}
    </Badge>
  );
}