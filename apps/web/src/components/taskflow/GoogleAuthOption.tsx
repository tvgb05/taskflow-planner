"use client";

import { API_BASE_URL } from "@/lib/api";

export function GoogleAuthOption({
  label,
  dividerLabel,
}: {
  label: string;
  dividerLabel: string;
}) {
  return (
    <div className="grid gap-4">
      <a
        href={`${API_BASE_URL}/auth/google/redirect`}
        className="inline-flex h-10 w-full items-center justify-center gap-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-sm font-semibold text-slate-900 dark:text-slate-100 transition hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
      >
        <span className="grid h-5 w-5 place-items-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300">
          G
        </span>
        {label}
      </a>
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
          {dividerLabel}
        </span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}
