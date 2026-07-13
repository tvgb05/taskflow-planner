"use client";

import {
  Check,
  ChevronDown,
  ChevronRight,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { FormEvent, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useAppText } from "@/lib/i18n";
import { usePreferences } from "@/lib/preferences";
import type {
  Subtask,
  SubtaskStatus,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/lib/types";
import { formatDate, todayDateInputValue } from "@/lib/utils";

const statusTone: Record<TaskStatus, "neutral" | "info" | "success"> = {
  todo: "neutral",
  in_progress: "info",
  done: "success",
};

const priorityTone: Record<TaskPriority, "neutral" | "warning" | "danger"> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
};

type TaskEditForm = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  estimated_minutes: string;
};

type SubtaskEditForm = {
  title: string;
  description: string;
  estimated_minutes: string;
  scheduled_date: string;
};

export type TaskUpdate = Partial<
  Pick<
    Task,
    "status" | "priority" | "title" | "description" | "deadline" | "estimated_minutes"
  >
>;

function taskToForm(task: Task): TaskEditForm {
  return {
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    deadline: task.deadline ?? "",
    estimated_minutes: task.estimated_minutes ? String(task.estimated_minutes) : "",
  };
}

function subtaskToForm(subtask: Subtask): SubtaskEditForm {
  return {
    title: subtask.title,
    description: subtask.description ?? "",
    estimated_minutes: subtask.estimated_minutes
      ? String(subtask.estimated_minutes)
      : "",
    scheduled_date: subtask.scheduled_date ?? "",
  };
}

export function TaskCard({
  task,
  projectDeadline,
  onTaskChange,
  onDeleteTask,
  onCreateSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
}: {
  task: Task;
  projectDeadline: string;
  onTaskChange: (task: Task, updates: TaskUpdate) => Promise<void>;
  onDeleteTask: (task: Task) => Promise<void>;
  onCreateSubtask: (
    task: Task,
    input: {
      title: string;
      description: string | null;
      status: SubtaskStatus;
      estimated_minutes: number | null;
      scheduled_date: string | null;
    },
  ) => Promise<void>;
  onUpdateSubtask: (subtask: Subtask, updates: Partial<Subtask>) => Promise<void>;
  onDeleteSubtask: (subtask: Subtask) => Promise<void>;
}) {
  const { preferences } = usePreferences();
  const t = useAppText();
  const [expanded, setExpanded] = useState(false);
  const [editForm, setEditForm] = useState<TaskEditForm>(() => taskToForm(task));
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [minutes, setMinutes] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [busy, setBusy] = useState(false);

  const subtaskCount = task.subtasks.length;
  const doneSubtasks = task.subtasks.filter((subtask) => subtask.status === "done").length;
  const ExpandIcon = expanded ? ChevronDown : ChevronRight;

  async function guarded(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  async function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editForm.title.trim()) {
      return;
    }

    await guarded(() =>
      onTaskChange(task, {
        title: editForm.title.trim(),
        description: editForm.description || null,
        status: editForm.status,
        priority: editForm.priority,
        deadline: editForm.deadline || null,
        estimated_minutes: editForm.estimated_minutes
          ? Number(editForm.estimated_minutes)
          : null,
      }),
    );
  }

  async function submitSubtask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    await guarded(async () => {
      await onCreateSubtask(task, {
        title: title.trim(),
        description: description.trim() || null,
        status: "todo",
        estimated_minutes: minutes ? Number(minutes) : null,
        scheduled_date: scheduledDate || null,
      });
      setTitle("");
      setDescription("");
      setMinutes("");
      setScheduledDate("");
    });
  }

  return (
    <Card>
      <CardContent className="grid gap-4">
        <button
          type="button"
          className="flex w-full flex-col gap-3 text-left lg:flex-row lg:items-start lg:justify-between"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-label={expanded ? t.project.collapseTask : t.project.expandTask}
        >
          <div className="flex min-w-0 gap-3">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded border border-slate-200 bg-slate-50 text-slate-500">
              <ExpandIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-slate-950">
                  {task.title}
                </h3>
                <Badge tone={statusTone[task.status]}>
                  {t.status[task.status]}
                </Badge>
                <Badge tone={priorityTone[task.priority]}>
                  {t.priority[task.priority]}
                </Badge>
                {task.phase ? <Badge tone="info">{task.phase}</Badge> : null}
                <Badge tone="neutral">
                  {doneSubtasks}/{subtaskCount} {t.project.subtasks}
                </Badge>
              </div>
              {task.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                  {task.description}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-slate-500">
                {task.deadline
                  ? `${t.common.due} ${formatDate(task.deadline, preferences.dateFormat)}`
                  : t.project.noTaskDeadline}
                {task.estimated_minutes
                  ? ` - ${task.estimated_minutes} ${t.common.min}`
                  : ""}
              </p>
            </div>
          </div>
        </button>

        {expanded ? (
          <div className="grid gap-4 border-t border-slate-100 pt-4">
            <form
              onSubmit={submitTask}
              className="grid gap-3 rounded-md bg-slate-50 p-3"
            >
              <h4 className="text-sm font-semibold text-slate-950">
                {t.project.editTask}
              </h4>
              <Input
                label={t.common.title}
                value={editForm.title}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                required
              />
              <Textarea
                label={t.project.description}
                value={editForm.description}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
              <div className="grid gap-3 md:grid-cols-4">
                <Select
                  label={t.common.status}
                  value={editForm.status}
                  disabled={busy}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      status: event.target.value as TaskStatus,
                    }))
                  }
                >
                  <option value="todo">{t.status.todo}</option>
                  <option value="in_progress">{t.status.in_progress}</option>
                  <option value="done">{t.status.done}</option>
                </Select>
                <Select
                  label={t.common.priority}
                  value={editForm.priority}
                  disabled={busy}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      priority: event.target.value as TaskPriority,
                    }))
                  }
                >
                  <option value="low">{t.priority.low}</option>
                  <option value="medium">{t.priority.medium}</option>
                  <option value="high">{t.priority.high}</option>
                </Select>
                <Input
                  label={t.project.deadline}
                  type="date"
                  min={todayDateInputValue()}
                  max={projectDeadline}
                  value={editForm.deadline}
                  disabled={busy}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      deadline: event.target.value,
                    }))
                  }
                />
                <Input
                  label={t.project.minutes}
                  type="number"
                  min={5}
                  max={10080}
                  value={editForm.estimated_minutes}
                  disabled={busy}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      estimated_minutes: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="submit" className="w-full sm:w-fit" disabled={busy}>
                  <Save className="h-4 w-4" />
                  {t.common.saveChanges}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="w-full sm:w-fit"
                  disabled={busy}
                  onClick={() => guarded(() => onDeleteTask(task))}
                >
                  <Trash2 className="h-4 w-4" />
                  {t.common.delete}
                </Button>
              </div>
            </form>

            <div className="grid gap-2">
              <h4 className="text-sm font-semibold text-slate-950">
                {t.project.taskDetails}
              </h4>
              {task.subtasks.length === 0 ? (
                <p className="rounded border border-dashed border-slate-200 px-3 py-3 text-sm text-slate-500">
                  {t.project.noSubtasksYet}
                </p>
              ) : (
                task.subtasks.map((subtask) => (
                  <SubtaskEditor
                    key={`${subtask.id}-${subtask.updated_at}`}
                    subtask={subtask}
                    busy={busy}
                    guarded={guarded}
                    onUpdateSubtask={onUpdateSubtask}
                    onDeleteSubtask={onDeleteSubtask}
                  />
                ))
              )}
            </div>

            <form
              onSubmit={submitSubtask}
              className="grid gap-3 rounded-md bg-slate-50 p-3"
            >
              <Input
                label={t.project.subtask}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t.project.designProjectForm}
              />
              <Textarea
                label={t.project.description}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
              <div className="grid gap-3 md:grid-cols-[140px_160px_auto] md:items-end">
                <Input
                  label={t.project.minutes}
                  type="number"
                  min={5}
                  max={720}
                  value={minutes}
                  onChange={(event) => setMinutes(event.target.value)}
                />
                <Input
                  label={t.project.date}
                  type="date"
                  value={scheduledDate}
                  onChange={(event) => setScheduledDate(event.target.value)}
                />
                <Button type="submit" disabled={busy} title={t.project.addSubtask}>
                  <Plus className="h-4 w-4" />
                  {t.common.add}
                </Button>
              </div>
            </form>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SubtaskEditor({
  subtask,
  busy,
  guarded,
  onUpdateSubtask,
  onDeleteSubtask,
}: {
  subtask: Subtask;
  busy: boolean;
  guarded: (action: () => Promise<void>) => Promise<void>;
  onUpdateSubtask: (subtask: Subtask, updates: Partial<Subtask>) => Promise<void>;
  onDeleteSubtask: (subtask: Subtask) => Promise<void>;
}) {
  const t = useAppText();
  const [form, setForm] = useState<SubtaskEditForm>(() =>
    subtaskToForm(subtask),
  );

  async function submitSubtaskEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      return;
    }

    await guarded(() =>
      onUpdateSubtask(subtask, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        estimated_minutes: form.estimated_minutes
          ? Number(form.estimated_minutes)
          : null,
        scheduled_date: form.scheduled_date || null,
      }),
    );
  }

  return (
    <form
      onSubmit={submitSubtaskEdit}
      className="grid gap-3 rounded border border-slate-100 px-3 py-3"
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_140px_150px_auto] lg:items-end">
        <Input
          label={t.project.subtask}
          value={form.title}
          disabled={busy}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              title: event.target.value,
            }))
          }
          required
        />
        <Input
          label={t.project.minutes}
          type="number"
          min={5}
          max={720}
          value={form.estimated_minutes}
          disabled={busy}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              estimated_minutes: event.target.value,
            }))
          }
        />
        <Input
          label={t.project.scheduled}
          type="date"
          value={form.scheduled_date}
          disabled={busy}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              scheduled_date: event.target.value,
            }))
          }
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className={
              subtask.status === "done"
                ? "h-10 w-10 px-0 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "h-10 w-10 px-0"
            }
            disabled={busy}
            onClick={() =>
              guarded(() =>
                onUpdateSubtask(subtask, {
                  status: subtask.status === "done" ? "todo" : "done",
                }),
              )
            }
            aria-label={
              subtask.status === "done"
                ? t.dashboard.reopenTask
                : t.dashboard.completeTask
            }
            title={
              subtask.status === "done"
                ? t.dashboard.reopenTask
                : t.dashboard.completeTask
            }
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="danger"
            className="h-10 w-10 px-0"
            disabled={busy}
            onClick={() => guarded(() => onDeleteSubtask(subtask))}
            aria-label={t.common.delete}
            title={t.common.delete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Textarea
        label={t.project.description}
        value={form.description}
        disabled={busy}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            description: event.target.value,
          }))
        }
      />

      <div className="flex flex-wrap justify-between gap-2">
        <Badge tone={subtask.status === "done" ? "success" : "neutral"}>
          {t.status[subtask.status]}
        </Badge>
        <Button type="submit" variant="secondary" disabled={busy}>
          <Save className="h-4 w-4" />
          {t.common.saveChanges}
        </Button>
      </div>
    </form>
  );
}
