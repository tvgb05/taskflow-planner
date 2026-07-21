import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Select({
  label,
  error,
  className,
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
}) {
  const selectId = id ?? props.name;

  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
      <span>{label}</span>
      <select
        id={selectId}
        className={cn(
          "h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-950 dark:text-slate-50 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:focus:ring-cyan-900",
          error && "border-rose-300 dark:border-rose-700 focus:border-rose-500 focus:ring-rose-100 dark:focus:ring-rose-900",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="text-xs text-rose-600 dark:text-rose-400">{error}</span> : null}
    </label>
  );
}
