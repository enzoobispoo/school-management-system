"use client";

interface HeaderTitleBlockProps {
  title: string;
  description?: string;
}

export function HeaderTitleBlock({
  title,
  description,
}: HeaderTitleBlockProps) {
  return (
    <div className="min-w-0">
      <h1 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
        {title}
      </h1>
      {description ? (
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}