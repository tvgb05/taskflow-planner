import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
};

export function Input({
  label,
  error,
  hint,
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & FieldProps) {
  const inputId = id ?? props.name;

  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
      <span>{label}</span>
      <input
        id={inputId}
        className={cn(
          "h-10 rounded-md border border-slate-200 bg-white px-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:ring-cyan-900 sm:text-sm",
          error && "border-rose-300 dark:border-rose-700 focus:border-rose-500 focus:ring-rose-100 dark:focus:ring-rose-900",
          className,
        )}
        {...props}
      />
      {hint && !error ? (
        <span className="text-xs font-normal leading-5 text-slate-500 dark:text-slate-400">
          {hint}
        </span>
      ) : null}
      {error ? <span className="text-xs text-rose-600 dark:text-rose-400">{error}</span> : null}
    </label>
  );
}
