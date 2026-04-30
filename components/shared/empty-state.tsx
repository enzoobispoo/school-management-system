interface EmptyStateProps {
    message: string;
    className?: string;
  }
  
  export function EmptyState({
    message,
    className = "",
  }: EmptyStateProps) {
    return (
      <div
        className={`rounded-[28px] border border-border bg-card p-10 text-sm text-muted-foreground ${className}`}
      >
        {message}
      </div>
    );
  }