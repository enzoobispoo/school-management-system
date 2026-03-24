interface ErrorStateProps {
    message: string;
    className?: string;
  }
  
  export function ErrorState({
    message,
    className = "",
  }: ErrorStateProps) {
    return (
      <div
        className={`rounded-[28px] border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive ${className}`}
      >
        {message}
      </div>
    );
  }