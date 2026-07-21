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
        className="inline-flex h-10 w-full items-center justify-center gap-3 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
      >
        <span className="grid h-5 w-5 place-items-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-700">
          G
        </span>
        {label}
      </a>
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium text-slate-400">
          {dividerLabel}
        </span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
    </div>
  );
}
