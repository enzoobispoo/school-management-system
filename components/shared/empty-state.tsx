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
        className={`rounded-[28px] border border-black/5 bg-white p-10 text-sm text-muted-foreground ${className}`}
      >
        {message}
      </div>
    );
  }