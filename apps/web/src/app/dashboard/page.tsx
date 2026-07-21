"use client";

/* eslint-disable react-hooks/set-state-in-effect -- The first-run guide hydrates from localStorage after mount. */

import {
  AlertTriangle,
  CalendarClock,
  Check,
  CircleHelp,
  FolderKanban,
  ListPlus,
  ListTodo,
  Pencil,
  Plus,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AppShell, RequireAuth } from "@/components/taskflow/AppShell";
import {
  getDashboardGuideSteps,
  GuideOverlay,
} from "@/components/taskflow/GuideOverlay";
import { ProjectIcon } from "@/components/taskflow/ProjectIcon";
import { ResourceLinks } from "@/components/taskflow/ResourceLinks";
import {
  OneOffTaskModal,
  type OneOffTaskValues,
} from "@/components/taskflow/OneOffTaskModal";
import { WelcomeOnboardingModal } from "@/components/taskflow/WelcomeOnboardingModal";
import { Button, iconOnlyButtonStyles } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import {
  ApiRequestError,
  apiRequest,
  unwrapCollection,
  unwrapResource,
} from "@/lib/api";
import {
  guideStorageKeys,
  isOnboardingActive,
  stopOnboarding,
} from "@/lib/guide";
import { useAppText } from "@/lib/i18n";
import { usePreferences } from "@/lib/preferences";
import type {
  Project,
  Subtask,
  Task,
  ValidationErrors,
} from "@/lib/types";
import {
  cn,
  formatDate,
  isDueSoon,
  todayDateInputValue,
} from "@/lib/utils";

type Metric = {
  label: string;
  value: number;
  icon: typeof FolderKanban;
};

type DashboardTask = Task & {
  project: Project | null;
};

type DashboardSubtask = Subtask & {
  task: DashboardTask;
};

const taskCompletionStyles = {
  pending: {
    variant: "primary" as const,
    buttonClassName: "h-9 px-3",
    iconClassName: "h-4 w-4",
  },
  done: {
    variant: "secondary" as const,
    buttonClassName: "h-9 px-3",
    iconClassName: "h-4 w-4 text-emerald-600",
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const { preferences } = usePreferences();
  const t = useAppText();
  const [projects, setProjects] = useState<Project[]>([]);
  const [standaloneTasks, setStandaloneTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [creatingSampleGoal, setCreatingSampleGoal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingStandaloneTask, setEditingStandaloneTask] =
    useState<Task | null>(null);
  const [standaloneTaskBusy, setStandaloneTaskBusy] = useState(false);
  const [standaloneTaskMessage, setStandaloneTaskMessage] = useState<
    string | null
  >(null);
  const [standaloneTaskErrors, setStandaloneTaskErrors] =
    useState<ValidationErrors>();
  const [deletingStandaloneTask, setDeletingStandaloneTask] =
    useState<Task | null>(null);

  useEffect(() => {
    Promise.all([
      apiRequest<Project[] | { data: Project[] }>("/projects"),
      apiRequest<Task[] | { data: Task[] }>("/tasks"),
    ])
      .then(([projectPayload, taskPayload]) => {
        setProjects(unwrapCollection(projectPayload));
        setStandaloneTasks(unwrapCollection(taskPayload));
      })
      .catch(() => setError(t.dashboard.loadError))
      .finally(() => setLoading(false));
  }, [t.dashboard.loadError]);

  useEffect(() => {
    const welcomePending =
      localStorage.getItem(guideStorageKeys.welcomePending) === "1";
    const welcomeSeen =
      localStorage.getItem(guideStorageKeys.welcomeSeen) === "1";

    if (welcomePending && !welcomeSeen) {
      setWelcomeOpen(true);
      return;
    }

    const pending = localStorage.getItem(guideStorageKeys.dashboardPending) === "1";
    const seen = localStorage.getItem(guideStorageKeys.dashboardSeen) === "1";

    if (pending && !seen) {
      setGuideOpen(true);
    }
  }, []);

  function closeDashboardGuide() {
    localStorage.setItem(guideStorageKeys.dashboardSeen, "1");
    localStorage.removeItem(guideStorageKeys.dashboardPending);
    if (isOnboardingActive()) {
      stopOnboarding();
    }
    setGuideOpen(false);
  }

  function completeDashboardGuide() {
    localStorage.setItem(guideStorageKeys.dashboardSeen, "1");
    localStorage.removeItem(guideStorageKeys.dashboardPending);
    setGuideOpen(false);

    if (isOnboardingActive()) {
      router.push("/projects/new?guide=create-project&onboarding=1");
    }
  }

  async function startOnboarding() {
    localStorage.setItem(guideStorageKeys.welcomeSeen, "1");
    localStorage.removeItem(guideStorageKeys.welcomePending);

    if (projects.length > 0) {
      setWelcomeOpen(false);
      setGuideOpen(true);
      return;
    }

    setCreatingSampleGoal(true);
    setError(null);

    try {
      const deadline = new Date();
      deadline.setHours(12, 0, 0, 0);
      deadline.setDate(deadline.getDate() + 7);
      const payload = await apiRequest<Project | { data: Project }>(
        "/projects",
        {
          method: "POST",
          body: {
            name: t.guide.welcome.sampleGoalName,
            description: t.guide.welcome.sampleGoalDescription,
            icon: "sparkles",
            project_type: "short_term",
            planning_mode: "phased",
            deadline: deadline.toISOString().slice(0, 10),
            available_minutes_per_day: 60,
          },
        },
      );
      const sampleGoal = unwrapResource(payload);

      localStorage.setItem(
        guideStorageKeys.projectPendingId,
        String(sampleGoal.id),
      );
      setProjects([sampleGoal]);
      setWelcomeOpen(false);
      router.push(`/projects/${sampleGoal.id}?guide=first-project&onboarding=1`);
    } catch {
      setError(t.newProject.createError);
    } finally {
      setCreatingSampleGoal(false);
    }
  }

  function skipOnboarding() {
    localStorage.setItem(guideStorageKeys.welcomeSeen, "1");
    localStorage.removeItem(guideStorageKeys.welcomePending);
    stopOnboarding();
    setWelcomeOpen(false);
  }

  const goalTasks = useMemo<DashboardTask[]>(
    () =>
      projects.flatMap((project) =>
        (project.tasks ?? []).map((task) => ({
          ...task,
          project,
        })),
      ),
    [projects],
  );

  const standaloneDashboardTasks = useMemo<DashboardTask[]>(
    () => standaloneTasks.map((task) => ({ ...task, project: null })),
    [standaloneTasks],
  );

  const tasks = useMemo<DashboardTask[]>(
    () => [...goalTasks, ...standaloneDashboardTasks],
    [goalTasks, standaloneDashboardTasks],
  );

  const todayKey = useMemo(() => todayDateInputValue(), []);
  const todaySubtasks = useMemo<DashboardSubtask[]>(
    () =>
      tasks.flatMap((task) =>
        task.subtasks
          .filter((subtask) => subtask.scheduled_date === todayKey)
          .map((subtask) => ({ ...subtask, task })),
      ),
    [tasks, todayKey],
  );

  const metrics: Metric[] = [
    { label: t.dashboard.projects, value: projects.length, icon: FolderKanban },
    {
      label: t.dashboard.dueSoon,
      value: tasks.filter((task) => isDueSoon(task.deadline)).length,
      icon: CalendarClock,
    },
    {
      label: t.dashboard.inProgress,
      value: tasks.filter((task) => task.status === "in_progress").length,
      icon: ListTodo,
    },
    {
      label: t.dashboard.today,
      value:
        todaySubtasks.length +
        standaloneTasks.filter(
          (task) => task.status !== "done" && task.deadline === todayKey,
        ).length,
      icon: Timer,
    },
  ];

  function replaceTask(nextTask: Task) {
    if (nextTask.project_id === null) {
      setStandaloneTasks((current) =>
        current.map((task) => (task.id === nextTask.id ? nextTask : task)),
      );
    }

    setProjects((current) =>
      current.map((project) => {
        const nextTasks = (project.tasks ?? []).map((task) =>
          task.id === nextTask.id ? nextTask : task,
        );
        const doneTasks = nextTasks.filter((task) => task.status === "done").length;

        return {
          ...project,
          tasks: nextTasks,
          done_tasks_count: doneTasks,
          progress: nextTasks.length ? Math.round((doneTasks / nextTasks.length) * 100) : 0,
        };
      }),
    );
    setSelectedTask((current) =>
      current?.id === nextTask.id ? nextTask : current,
    );
  }

  function openNewStandaloneTask() {
    setEditingStandaloneTask(null);
    setStandaloneTaskMessage(null);
    setStandaloneTaskErrors(undefined);
    setTaskModalOpen(true);
  }

  function openStandaloneTaskEditor(task: Task) {
    setEditingStandaloneTask(task);
    setStandaloneTaskMessage(null);
    setStandaloneTaskErrors(undefined);
    setTaskModalOpen(true);
  }

  async function saveStandaloneTask(values: OneOffTaskValues) {
    setStandaloneTaskBusy(true);
    setStandaloneTaskMessage(null);
    setStandaloneTaskErrors(undefined);

    try {
      const payload = await apiRequest<Task | { data: Task }>(
        editingStandaloneTask
          ? `/tasks/${editingStandaloneTask.id}`
          : "/tasks",
        {
          method: editingStandaloneTask ? "PUT" : "POST",
          body: {
            title: values.title.trim(),
            description: values.description.trim() || null,
            status: values.status,
            priority: values.priority,
            deadline: values.deadline || null,
            estimated_minutes: values.estimatedMinutes
              ? Number(values.estimatedMinutes)
              : null,
          },
        },
      );
      const savedTask = unwrapResource(payload);

      if (editingStandaloneTask) {
        replaceTask(savedTask);
      } else {
        setStandaloneTasks((current) => [savedTask, ...current]);
      }

      setTaskModalOpen(false);
      setEditingStandaloneTask(null);
    } catch (requestError) {
      setStandaloneTaskMessage(
        editingStandaloneTask
          ? t.dashboard.updateOneOffTaskError
          : t.dashboard.createOneOffTaskError,
      );
      if (requestError instanceof ApiRequestError) {
        setStandaloneTaskErrors(requestError.errors);
      }
    } finally {
      setStandaloneTaskBusy(false);
    }
  }

  async function deleteStandaloneTask() {
    if (!deletingStandaloneTask) {
      return;
    }

    setStandaloneTaskBusy(true);
    setStandaloneTaskMessage(null);

    try {
      await apiRequest(`/tasks/${deletingStandaloneTask.id}`, {
        method: "DELETE",
      });
      setStandaloneTasks((current) =>
        current.filter((task) => task.id !== deletingStandaloneTask.id),
      );
      setSelectedTask((current) =>
        current?.id === deletingStandaloneTask.id ? null : current,
      );
      setDeletingStandaloneTask(null);
      setEditingStandaloneTask(null);
    } catch {
      const failedTask = deletingStandaloneTask;
      setDeletingStandaloneTask(null);
      setEditingStandaloneTask(failedTask);
      setStandaloneTaskMessage(t.dashboard.deleteOneOffTaskError);
      setTaskModalOpen(true);
    } finally {
      setStandaloneTaskBusy(false);
    }
  }

  async function updateTaskStatus(task: Task, done: boolean) {
    setUpdatingTaskId(task.id);

    try {
      const payload = await apiRequest<Task | { data: Task }>(
        `/tasks/${task.id}`,
        {
          method: "PUT",
          body: {
            title: task.title,
            description: task.description,
            status: done ? "done" : "todo",
            priority: task.priority,
            deadline: task.deadline,
            estimated_minutes: task.estimated_minutes,
          },
        },
      );
      replaceTask(unwrapResource(payload));
    } catch {
      setError(t.project.updateTaskError);
    } finally {
      setUpdatingTaskId(null);
    }
  }

  return (
    <RequireAuth>
      <AppShell
        title={t.dashboard.title}
        description={t.dashboard.description}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setGuideOpen(true)}
            >
              <CircleHelp className="h-4 w-4" />
              {t.common.guide}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={openNewStandaloneTask}
            >
              <ListPlus className="h-4 w-4" />
              {t.dashboard.newOneOffTask}
            </Button>
            <Link href="/projects/new" data-guide="new-project">
              <Button type="button">
                <Plus className="h-4 w-4" />
                {t.common.newProject}
              </Button>
            </Link>
          </div>
        }
      >
        {loading ? <LoadingState label={t.dashboard.loading} /> : null}
        {error ? <ErrorMessage message={error} /> : null}

        {!loading && !error ? (
          <div className="grid gap-6">
            <section
              data-guide="dashboard-metrics"
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              {metrics.map((metric) => {
                const Icon = metric.icon;

                return (
                  <Card key={metric.label}>
                    <CardContent className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          {metric.label}
                        </p>
                        <p className="mt-2 text-3xl font-bold text-slate-950">
                          {metric.value}
                        </p>
                      </div>
                      <div className="grid h-11 w-11 place-items-center rounded-md bg-cyan-50 text-cyan-700">
                        <Icon className="h-5 w-5" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </section>

            <Card data-guide="one-off-tasks">
              <CardContent>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">
                      {t.dashboard.oneOffTasks}
                    </h2>
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      {t.dashboard.oneOffTasksDescription}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={openNewStandaloneTask}
                  >
                    <Plus className="h-4 w-4" />
                    {t.dashboard.createOneOffTask}
                  </Button>
                </div>
                <TaskList
                  tasks={standaloneDashboardTasks}
                  updatingTaskId={updatingTaskId}
                  emptyTitle={t.dashboard.noOneOffTasks}
                  onOpenTask={setSelectedTask}
                  onEditStandaloneTask={openStandaloneTaskEditor}
                  onUpdateTaskStatus={updateTaskStatus}
                />
              </CardContent>
            </Card>

            <section
              className={
                projects.length === 1
                  ? "grid gap-3"
                  : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
              }
            >
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className={projects.length === 1 ? "block" : undefined}
                >
                  <Card className="h-full transition hover:border-cyan-200 hover:shadow-sm">
                    <CardContent
                      className={
                        projects.length === 1
                          ? "grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(240px,0.8fr)] sm:items-center"
                          : "grid gap-3"
                      }
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-md bg-cyan-50 text-cyan-700">
                          <ProjectIcon icon={project.icon} className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">{project.name}</p>
                          <p className="text-xs text-slate-500">{t.dashboard.projectProgress}</p>
                        </div>
                        <span className="ml-auto text-sm font-bold text-slate-700">{project.progress}%</span>
                      </div>
                      <div className="grid gap-2">
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-cyan-600 transition-[width]"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500">
                          {project.done_tasks_count}/{project.tasks_count} {t.common.done}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </section>

            <section
              data-guide="dashboard-work"
              className="grid gap-4 lg:grid-cols-2"
            >
              <Card>
                <CardContent>
                  <h2 className="text-base font-semibold text-slate-950">
                    {t.dashboard.tasksDueSoon}
                  </h2>
                  <TaskList
                    tasks={tasks.filter((task) => isDueSoon(task.deadline))}
                    updatingTaskId={updatingTaskId}
                    onOpenTask={setSelectedTask}
                    onUpdateTaskStatus={updateTaskStatus}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <h2 className="text-base font-semibold text-slate-950">
                    {t.dashboard.todayScheduledSubtasks}
                  </h2>
                  {todaySubtasks.length === 0 ? (
                    <EmptyState title={t.dashboard.noSubtasksToday} />
                  ) : (
                    <div className="mt-4 grid gap-2">
                      {todaySubtasks.map(({ task, ...subtask }) => (
                        <SubtaskRow
                          key={`${task.id}-${subtask.id}`}
                          subtask={subtask}
                          task={task}
                          onOpenTask={setSelectedTask}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        ) : null}
        {guideOpen ? (
          <GuideOverlay
            open={guideOpen}
            onClose={closeDashboardGuide}
            onComplete={completeDashboardGuide}
            steps={getDashboardGuideSteps(preferences.language)}
          />
        ) : null}
        <WelcomeOnboardingModal
          open={welcomeOpen}
          onStart={startOnboarding}
          onSkip={skipOnboarding}
          busy={creatingSampleGoal || loading}
        />
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
        {taskModalOpen ? (
          <OneOffTaskModal
            key={editingStandaloneTask?.id ?? "new"}
            task={editingStandaloneTask}
            busy={standaloneTaskBusy}
            message={standaloneTaskMessage}
            errors={standaloneTaskErrors}
            onClose={() => {
              if (!standaloneTaskBusy) {
                setTaskModalOpen(false);
                setEditingStandaloneTask(null);
              }
            }}
            onSubmit={saveStandaloneTask}
            onRequestDelete={(task) => {
              setTaskModalOpen(false);
              setDeletingStandaloneTask(task);
            }}
          />
        ) : null}
        <Modal
          open={Boolean(deletingStandaloneTask)}
          title={t.dashboard.deleteOneOffTaskTitle}
          onClose={() => {
            if (!standaloneTaskBusy) {
              setDeletingStandaloneTask(null);
            }
          }}
        >
          <div className="grid gap-5">
            <div className="flex gap-3 rounded-md border border-rose-200 bg-rose-50 p-4 text-rose-950">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
              <div>
                <p className="font-semibold">
                  {deletingStandaloneTask?.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-rose-800">
                  {t.dashboard.deleteOneOffTaskConfirmation}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={standaloneTaskBusy}
                onClick={() => setDeletingStandaloneTask(null)}
              >
                {t.common.cancel}
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={standaloneTaskBusy}
                onClick={deleteStandaloneTask}
              >
                {t.common.delete}
              </Button>
            </div>
          </div>
        </Modal>
      </AppShell>
    </RequireAuth>
  );
}

function TaskList({
  tasks,
  updatingTaskId,
  emptyTitle,
  onOpenTask,
  onEditStandaloneTask,
  onUpdateTaskStatus,
}: {
  tasks: DashboardTask[];
  updatingTaskId: number | null;
  emptyTitle?: string;
  onOpenTask: (task: Task) => void;
  onEditStandaloneTask?: (task: Task) => void;
  onUpdateTaskStatus: (task: Task, done: boolean) => void;
}) {
  const { preferences } = usePreferences();
  const t = useAppText();

  if (tasks.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? t.dashboard.noUpcomingTaskDeadlines}
      />
    );
  }

  return (
    <div className="mt-4 grid gap-2">
      {tasks.map((task) => {
        const isDone = task.status === "done";
        const completionStyle =
          taskCompletionStyles[isDone ? "done" : "pending"];
        const actionLabel = isDone ? t.dashboard.reopenTask : t.common.done;

        return (
          <div
            key={task.id}
            className="flex flex-col gap-3 rounded border border-slate-100 px-3 py-2 transition hover:border-cyan-200 hover:bg-cyan-50/40 sm:flex-row sm:items-center sm:justify-between"
          >
          <button
            type="button"
            className="flex min-w-0 flex-1 gap-3 text-left"
            onClick={() => onOpenTask(task)}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-cyan-100 bg-cyan-50 text-cyan-700">
              {task.project ? (
                <ProjectIcon icon={task.project.icon} className="h-4 w-4" />
              ) : (
                <ListTodo className="h-4 w-4" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-900">
                {task.title}
              </span>
              <span className="block text-xs text-slate-500">
                {task.project?.name ?? t.dashboard.oneOffTask}
                {task.deadline
                  ? ` - ${t.common.due} ${formatDate(task.deadline, preferences.dateFormat)}`
                  : ` - ${t.common.noDate}`}
              </span>
            </span>
          </button>
          <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
            <span className="text-xs font-semibold uppercase text-slate-500">
              {t.priority[task.priority]}
            </span>
            {!task.project && onEditStandaloneTask ? (
              <Button
                type="button"
                variant="secondary"
                className={cn(iconOnlyButtonStyles, "h-9 w-9")}
                onClick={(event) => {
                  event.stopPropagation();
                  onEditStandaloneTask(task);
                }}
                aria-label={t.dashboard.editOneOffTask}
                title={t.dashboard.editOneOffTask}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant={completionStyle.variant}
              className={completionStyle.buttonClassName}
              disabled={updatingTaskId === task.id}
              onClick={(event) => {
                event.stopPropagation();
                onUpdateTaskStatus(task, !isDone);
              }}
              aria-label={
                isDone
                  ? t.dashboard.reopenTask
                  : t.dashboard.completeTask
              }
              title={
                isDone
                  ? t.dashboard.reopenTask
                  : t.dashboard.completeTask
              }
            >
              <Check className={completionStyle.iconClassName} />
              <span className="hidden sm:inline">{actionLabel}</span>
            </Button>
          </div>
          </div>
        );
      })}
    </div>
  );
}

function SubtaskRow({
  subtask,
  task,
  onOpenTask,
}: {
  subtask: Subtask;
  task: DashboardTask;
  onOpenTask: (task: Task) => void;
}) {
  const t = useAppText();

  return (
    <button
      type="button"
      className="w-full rounded border border-slate-100 px-3 py-2 text-left transition hover:border-cyan-200 hover:bg-cyan-50/40"
      onClick={() => onOpenTask(task)}
    >
      <div className="flex gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-cyan-100 bg-cyan-50 text-cyan-700">
          {task.project ? (
            <ProjectIcon icon={task.project.icon} className="h-4 w-4" />
          ) : (
            <ListTodo className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            {subtask.title}
          </p>
          {subtask.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">
              {subtask.description}
            </p>
          ) : null}
          <p className="text-xs text-slate-500">
            {task.project?.name ?? t.dashboard.oneOffTask} - {task.title} -{" "}
            {subtask.estimated_minutes ?? 30} {t.common.min}
          </p>
        </div>
      </div>
    </button>
  );
}

function TaskDetailModal({
  task,
  onClose,
}: {
  task: Task | null;
  onClose: () => void;
}) {
  const { preferences } = usePreferences();
  const t = useAppText();

  if (!task) {
    return null;
  }

  return (
    <Modal open={Boolean(task)} title={task.title} onClose={onClose}>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              tone={
                task.status === "done"
                  ? "success"
                  : task.status === "in_progress"
                    ? "info"
                    : "neutral"
              }
            >
              {t.status[task.status]}
            </Badge>
            <Badge
              tone={
                task.priority === "high"
                  ? "danger"
                  : task.priority === "medium"
                    ? "warning"
                    : "neutral"
              }
            >
              {t.priority[task.priority]}
            </Badge>
            <span className="text-sm text-slate-500">
              {task.deadline
                ? `${t.common.due} ${formatDate(task.deadline, preferences.dateFormat)}`
                : t.project.noTaskDeadline}
            </span>
          </div>
          <p className="text-sm leading-6 text-slate-700">
            {task.description || t.common.noDescription}
          </p>
          <ResourceLinks resources={task.resources} />
          {task.estimated_minutes ? (
            <p className="text-sm text-slate-500">
              {task.estimated_minutes} {t.common.min}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <h3 className="text-sm font-semibold text-slate-950">
            {t.project.subtasks}
          </h3>
          {task.subtasks.length === 0 ? (
            <EmptyState title={t.project.noSubtasksYet} />
          ) : (
            task.subtasks.map((subtask, index) => (
              <div
                key={subtask.id}
                className="grid gap-1 rounded border border-slate-100 px-3 py-2"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium leading-6 text-slate-900">
                      {subtask.title}
                    </p>
                    {subtask.description ? (
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {subtask.description}
                      </p>
                    ) : null}
                    <ResourceLinks resources={subtask.resources} compact />
                    <p className="text-xs text-slate-500">
                      {subtask.estimated_minutes ?? 30} {t.common.min}
                      {subtask.scheduled_date
                        ? ` - ${formatDate(subtask.scheduled_date, preferences.dateFormat)}`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
