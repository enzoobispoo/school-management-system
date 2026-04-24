import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 rounded-md border border-black/10 bg-white px-3 py-1 text-base text-black shadow-xs outline-none transition-[color,box-shadow,height,padding,background-color,border-color] md:text-sm",
        "placeholder:text-black/42 selection:bg-primary selection:text-primary-foreground",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-black",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "h-9 data-[density=compact]:h-8",
        "focus-visible:border-black/10 focus-visible:ring-[3px] focus-visible:ring-black/5",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "dark:border-input dark:bg-input/30 dark:text-foreground dark:placeholder:text-muted-foreground dark:file:text-foreground dark:focus-visible:border-ring dark:focus-visible:ring-ring/50",
        className
      )}
      {...props}
    />
  );
}

export { Input };