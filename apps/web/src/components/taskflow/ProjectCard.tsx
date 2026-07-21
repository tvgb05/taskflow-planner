import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { ProjectIcon } from "@/components/taskflow/ProjectIcon";
import { useAppText } from "@/lib/i18n";
import { usePreferences } from "@/lib/preferences";
import type { Project } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function ProjectCard({ project }: { project: Project }) {
  const { preferences } = usePreferences();
  const t = useAppText();
  const projectTypeLabel = {
    short_term: t.project.shortTerm,
    long_term: t.project.longTerm,
    daily_recurring: t.project.dailyRecurring,
  }[project.project_type];

  return (
    <Card className="h-full transition hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-sm">
      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-cyan-100 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300">
              <ProjectIcon icon={project.icon} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-slate-950 dark:text-slate-50">
                  {project.name}
                </h3>
                <Badge tone="neutral">{projectTypeLabel}</Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                {project.description || t.common.noDescription}
              </p>
            </div>
          </div>
          <Badge tone={project.progress === 100 ? "success" : "info"}>
            {project.progress}%
          </Badge>
        </div>

        <div className="h-2 rounded bg-slate-100 dark:bg-slate-800">
          <div
            className="h-2 rounded bg-cyan-600"
            style={{ width: `${project.progress}%` }}
          />
        </div>

        <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            {formatDate(project.deadline, preferences.dateFormat)}
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            {project.available_minutes_per_day} {t.common.minPerDay}
          </span>
        </div>

        <Link
          href={`/projects/${project.id}`}
          className="mt-auto inline-flex h-10 items-center justify-between rounded-md border border-slate-200 dark:border-slate-700 px-3 text-sm font-semibold text-slate-900 dark:text-slate-100 transition hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          {t.projects.openProject}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
