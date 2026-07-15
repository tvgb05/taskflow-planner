"use client";

import { ExternalLink } from "lucide-react";

import { useAppText } from "@/lib/i18n";
import type { ResourceLink } from "@/lib/types";

export function ResourceLinks({
  resources,
  compact = false,
}: {
  resources: ResourceLink[] | undefined;
  compact?: boolean;
}) {
  const t = useAppText();
  const safeResources = (resources ?? []).filter((resource) =>
    /^https?:\/\//i.test(resource.url),
  );

  if (safeResources.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-1.5">
      {!compact ? (
        <p className="text-xs font-semibold uppercase text-slate-500">
          {t.project.resources}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {safeResources.map((resource) => (
          <a
            key={`${resource.title}-${resource.url}`}
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="break-words">{resource.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
