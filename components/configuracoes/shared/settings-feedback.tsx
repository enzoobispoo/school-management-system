"use client";

interface SettingsFeedbackProps {
  error?: string;
  success?: string;
}

export function SettingsFeedback({
  error,
  success,
}: SettingsFeedbackProps) {
  return (
    <>
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-destructive/20 dark:bg-destructive/5 dark:text-destructive">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-black/5 bg-white p-4 text-sm text-black/60 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white/70">
          {success}
        </div>
      ) : null}
    </>
  );
}