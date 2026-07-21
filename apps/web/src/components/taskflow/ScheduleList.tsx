import { CalendarDays, Clock } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppText } from "@/lib/i18n";
import { usePreferences } from "@/lib/preferences";
import type { ScheduleDay, TaskPriority } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const priorityTone: Record<TaskPriority, "danger" | "warning" | "neutral"> = {
  high: "danger",
  medium: "warning",
  low: "neutral",
};

export function ScheduleList({
  days,
  dailyCapacity,
}: {
  days: ScheduleDay[];
  dailyCapacity: number;
}) {
  const { preferences } = usePreferences();
  const t = useAppText();

  if (days.length === 0) {
    return (
      <EmptyState
        title={t.schedule.emptyTitle}
        description={t.schedule.emptyDescription}
      />
    );
  }

  return (
    <div className="grid gap-3">
      {days.map((day) => {
        const width = Math.min(100, Math.round((day.used_minutes / dailyCapacity) * 100));

        return (
          <section
            key={day.date}
            className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                <CalendarDays className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
                {formatDate(day.date, preferences.dateFormat)}
              </div>
              <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Clock className="h-4 w-4" />
                {day.used_minutes}/{dailyCapacity} {t.common.minutes}
              </div>
            </div>
            <div className="mt-3 h-2 rounded bg-slate-100 dark:bg-slate-800">
              <div
                className="h-2 rounded bg-cyan-600"
                style={{ width: `${width}%` }}
              />
            </div>
            <div className="mt-4 grid gap-2">
              {day.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex flex-col gap-2 rounded border border-slate-100 dark:border-slate-800 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {subtask.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {subtask.task_title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={priorityTone[subtask.priority]}>
                      {t.priority[subtask.priority]}
                    </Badge>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {subtask.estimated_minutes} {t.common.min}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
