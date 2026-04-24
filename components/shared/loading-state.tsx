interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Carregando...",
  className = "",
}: LoadingStateProps) {
  return (
    <div
      className={`rounded-[28px] border border-black/5 bg-white p-10 text-sm text-black/42 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white/60 ${className}`}
    >
      {message}
    </div>
  );
}