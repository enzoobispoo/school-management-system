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
      className={`mb-6 rounded-[28px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${className}`}
    >
      <div className="flex flex-col gap-5 p-6">
        {(title || description || actions) && (
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              {title ? (
                <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-black">
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