"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useAppText } from "@/lib/i18n";
import type {
  Task,
  TaskPriority,
  TaskStatus,
  ValidationErrors,
} from "@/lib/types";
import { todayDateInputValue } from "@/lib/utils";

export type OneOffTaskValues = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  estimatedMinutes: string;
};

function initialValues(task: Task | null): OneOffTaskValues {
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? "todo",
    priority: task?.priority ?? "medium",
    deadline: task?.deadline ?? "",
    estimatedMinutes: task?.estimated_minutes
      ? String(task.estimated_minutes)
      : "",
  };
}

export function OneOffTaskModal({
  task,
  busy,
  message,
  errors,
  onClose,
  onSubmit,
  onRequestDelete,
}: {
  task: Task | null;
  busy: boolean;
  message: string | null;
  errors?: ValidationErrors;
  onClose: () => void;
  onSubmit: (values: OneOffTaskValues) => Promise<void>;
  onRequestDelete: (task: Task) => void;
}) {
  const t = useAppText();
  const [values, setValues] = useState<OneOffTaskValues>(() =>
    initialValues(task),
  );
  const earliestDeadline =
    task?.deadline && task.deadline < todayDateInputValue()
      ? task.deadline
      : todayDateInputValue();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.title.trim()) {
      return;
    }

    await onSubmit(values);
  }

  return (
    <Modal
      open
      title={task ? t.dashboard.editOneOffTask : t.dashboard.newOneOffTask}
      onClose={onClose}
    >
      <form onSubmit={submit} className="grid gap-4">
        <p className="text-sm leading-6 text-slate-600">
          {t.dashboard.oneOffTaskFormHint}
        </p>
        <ErrorMessage message={message} errors={errors} />
        <Input
          label={t.common.title}
          value={values.title}
          error={errors?.title?.[0]}
          disabled={busy}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              title: event.target.value,
            }))
          }
          required
        />
        <Textarea
          label={t.project.description}
          value={values.description}
          error={errors?.description?.[0]}
          disabled={busy}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label={t.common.status}
            value={values.status}
            error={errors?.status?.[0]}
            disabled={busy}
            onChange={(event) =>
              setValues((current) => ({
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
            value={values.priority}
            error={errors?.priority?.[0]}
            disabled={busy}
            onChange={(event) =>
              setValues((current) => ({
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
            label={t.project.minutes}
            type="number"
            min={5}
            max={10080}
            value={values.estimatedMinutes}
            error={errors?.estimated_minutes?.[0]}
            disabled={busy}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                estimatedMinutes: event.target.value,
              }))
            }
          />
          <Input
            label={t.project.deadline}
            type="date"
            min={earliestDeadline}
            value={values.deadline}
            error={errors?.deadline?.[0]}
            disabled={busy}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                deadline: event.target.value,
              }))
            }
          />
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <div>
            {task ? (
              <Button
                type="button"
                variant="danger"
                disabled={busy}
                onClick={() => onRequestDelete(task)}
              >
                <Trash2 className="h-4 w-4" />
                {t.common.delete}
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={onClose}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={busy || !values.title.trim()}>
              {task ? (
                <Save className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {task ? t.common.saveChanges : t.dashboard.createOneOffTask}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
