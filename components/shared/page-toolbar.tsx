import { ReactNode } from "react";

interface PageToolbarProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function PageToolbar({
  title,
  description,
  actions,
  children,
  className = "",
}: PageToolbarProps) {
  return (
    <div
      className={`mb-5 rounded-xl border border-border/60 bg-card ${className}`}
    >
      <div className="flex flex-col gap-5 p-6">
        {(title || description || actions) && (
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              {title ? (
                <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                  {title}
                </h2>
              ) : null}

              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>

            {actions ? (
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            ) : null}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}