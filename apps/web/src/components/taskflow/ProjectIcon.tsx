"use client";

import {
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  Code2,
  Database,
  FolderKanban,
  GraduationCap,
  ListTodo,
  Rocket,
  Sparkles,
  Target,
  Wrench,
} from "lucide-react";

import { cn } from "@/lib/utils";

const projectIcons = [
  { key: "folder", label: "Folder", icon: FolderKanban },
  { key: "rocket", label: "Rocket", icon: Rocket },
  { key: "code", label: "Code", icon: Code2 },
  { key: "calendar", label: "Calendar", icon: CalendarClock },
  { key: "target", label: "Target", icon: Target },
  { key: "book", label: "Book", icon: BookOpen },
  { key: "briefcase", label: "Briefcase", icon: BriefcaseBusiness },
  { key: "graduation", label: "Graduation", icon: GraduationCap },
  { key: "database", label: "Database", icon: Database },
  { key: "wrench", label: "Wrench", icon: Wrench },
  { key: "sparkles", label: "Sparkles", icon: Sparkles },
  { key: "list", label: "List", icon: ListTodo },
] as const;

export type ProjectIconKey = (typeof projectIcons)[number]["key"];

export const defaultProjectIcon: ProjectIconKey = "folder";

export function normalizedProjectIcon(icon?: string | null): ProjectIconKey {
  return projectIcons.some((item) => item.key === icon)
    ? (icon as ProjectIconKey)
    : defaultProjectIcon;
}

export function ProjectIcon({
  icon,
  className,
}: {
  icon?: string | null;
  className?: string;
}) {
  const item =
    projectIcons.find((projectIcon) => projectIcon.key === icon) ??
    projectIcons[0];
  const Icon = item.icon;

  return <Icon className={cn("h-5 w-5", className)} aria-hidden="true" />;
}

export function ProjectIconPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (icon: ProjectIconKey) => void;
}) {
  const selected = normalizedProjectIcon(value);

  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium text-slate-700">{label}</legend>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
        {projectIcons.map((item) => {
          const Icon = item.icon;
          const active = selected === item.key;

          return (
            <button
              key={item.key}
              type="button"
              className={cn(
                "grid h-10 w-10 place-items-center rounded-md border text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700",
                active &&
                  "border-cyan-500 bg-cyan-50 text-cyan-800 ring-2 ring-cyan-100",
              )}
              onClick={() => onChange(item.key)}
              aria-pressed={active}
              aria-label={item.label}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
