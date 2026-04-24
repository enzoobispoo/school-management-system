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
      <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Painel
      </span>

      <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.04em] text-foreground">
        {title}
      </h1>

      {description ? (
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}