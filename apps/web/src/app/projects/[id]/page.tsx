"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Guide overlay opens from URL/localStorage after mount. */

import {
  ArrowLeft,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { AppShell, RequireAuth } from "@/components/taskflow/AppShell";
import {
  GuideOverlay,
  getAiSuggestGuideSteps,
  getProjectGuideSteps,
} from "@/components/taskflow/GuideOverlay";
import {
  defaultProjectIcon,
  normalizedProjectIcon,
  ProjectIcon,
  ProjectIconPicker,
} from "@/components/taskflow/ProjectIcon";
import { ScheduleList } from "@/components/taskflow/ScheduleList";
import { TaskCard, type TaskUpdate } from "@/components/taskflow/TaskCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ApiRequestError, apiRequest, unwrapResource } from "@/lib/api";
import {
  guideStorageKeys,
  isOnboardingActive,
  stopOnboarding,
} from "@/lib/guide";
import { useAppText } from "@/lib/i18n";
import { usePreferences } from "@/lib/preferences";
import { formatDate, todayDateInputValue } from "@/lib/utils";
import type {
  AiSuggestedSubtask,
  AiSuggestion,
  Project,
  ScheduleDay,
  ScheduleSubtask,
  Subtask,
  Task,
  TaskPriority,
  TaskStatus,
  ValidationErrors,
} from "@/lib/types";

type ScheduleResponse = {
  project_id: number;
  daily_capacity_minutes: number;
  schedule: ScheduleDay[];
};

type ProjectForm = {
  name: string;
  icon: string;
  description: string;
  deadline: string;
  available_minutes_per_day: string;
};

type TaskForm = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  estimated_minutes: string;
};

type AiSettings = {
  planningProfile: "portfolio" | "study" | "work" | "personal";
  aiStyle: "concise" | "detailed" | "coach";
  planMode: "phased" | "recurring" | "pipeline";
  recurrenceCycles: string;
  feedback: string;
  createSubtasks: boolean;
  autoSchedule: boolean;
  minTasks: string;
  maxTasks: string;
  minSubtasks: string;
  maxSubtasks: string;
};

type RepromptTarget =
  | { type: "task"; suggestionIndex: number }
  | { type: "subtask"; suggestionIndex: number; subtaskIndex: number };

const emptyTaskForm: TaskForm = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  deadline: "",
  estimated_minutes: "",
};

const defaultAiSettings: AiSettings = {
  planningProfile: "portfolio",
  aiStyle: "detailed",
  planMode: "phased",
  recurrenceCycles: "4",
  feedback: "",
  createSubtasks: true,
  autoSchedule: true,
  minTasks: "3",
  maxTasks: "6",
  minSubtasks: "2",
  maxSubtasks: "4",
};

function boundedAiCount(value: string, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.min(12, Math.round(parsed)));
}

function normalizedAiCounts(settings: AiSettings) {
  const minTasks = boundedAiCount(settings.minTasks, 3);
  const maxTasks = Math.max(minTasks, boundedAiCount(settings.maxTasks, 6));
  const minSubtasks = boundedAiCount(settings.minSubtasks, 2);
  const maxSubtasks = Math.max(
    minSubtasks,
    boundedAiCount(settings.maxSubtasks, 4),
  );

  return { minTasks, maxTasks, minSubtasks, maxSubtasks };
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = params.id;
  const { preferences } = usePreferences();
  const t = useAppText();

  const [project, setProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectForm>({
    name: "",
    icon: defaultProjectIcon,
    description: "",
    deadline: "",
    available_minutes_per_day: "120",
  });
  const [taskForm, setTaskForm] = useState<TaskForm>(emptyTaskForm);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    deadline: "",
  });
  const [generatedSchedule, setGeneratedSchedule] = useState<ScheduleDay[] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors | undefined>();

  const [aiOpen, setAiOpen] = useState(false);
  const [aiGoal, setAiGoal] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiSettings, setAiSettings] = useState<AiSettings>(defaultAiSettings);
  const [guideOpen, setGuideOpen] = useState(false);
  const [aiGuideOpen, setAiGuideOpen] = useState(false);
  const [guideChecked, setGuideChecked] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectInfoExpanded, setProjectInfoExpanded] = useState(false);
  const [repromptTarget, setRepromptTarget] = useState<RepromptTarget | null>(
    null,
  );
  const [repromptFeedback, setRepromptFeedback] = useState("");
  const [repromptLoading, setRepromptLoading] = useState(false);

  const loadProject = useCallback(async () => {
    const payload = await apiRequest<Project | { data: Project }>(
      `/projects/${projectId}`,
    );
    const nextProject = unwrapResource(payload);

    setProject(nextProject);
    setProjectForm({
      name: nextProject.name,
      icon: normalizedProjectIcon(nextProject.icon),
      description: nextProject.description ?? "",
      deadline: nextProject.deadline,
      available_minutes_per_day: String(nextProject.available_minutes_per_day),
    });
    setAiGoal(
      nextProject.description
        ? `${nextProject.name}: ${nextProject.description}`
        : nextProject.name,
    );
  }, [projectId]);

  useEffect(() => {
    let active = true;

    apiRequest<Project | { data: Project }>(`/projects/${projectId}`)
      .then((payload) => {
        if (!active) {
          return;
        }

        const nextProject = unwrapResource(payload);
        setProject(nextProject);
        setProjectForm({
          name: nextProject.name,
          icon: normalizedProjectIcon(nextProject.icon),
          description: nextProject.description ?? "",
          deadline: nextProject.deadline,
          available_minutes_per_day: String(
            nextProject.available_minutes_per_day,
          ),
        });
        setAiGoal(
          nextProject.description
            ? `${nextProject.name}: ${nextProject.description}`
            : nextProject.name,
        );
      })
      .catch(() => {
        if (active) {
          setMessage(t.project.loadProjectError);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [projectId, t.project.loadProjectError]);

  useEffect(() => {
    if (!project || guideChecked) {
      return;
    }

    const pendingProjectId = localStorage.getItem(guideStorageKeys.projectPendingId);
    const seen = localStorage.getItem(guideStorageKeys.projectSeen) === "1";
    const requested = searchParams.get("guide") === "first-project";

    if (!seen && (requested || pendingProjectId === String(project.id))) {
      setProjectInfoExpanded(true);
      setGuideOpen(true);
    }

    setGuideChecked(true);
  }, [guideChecked, project, searchParams]);

  useEffect(() => {
    if (!aiOpen) {
      return;
    }

    const seen = localStorage.getItem(guideStorageKeys.aiSuggestSeen) === "1";
    if (!seen) {
      setAiGuideOpen(true);
    }
  }, [aiOpen]);

  function clearFeedback() {
    setMessage(null);
    setErrors(undefined);
  }

  function handleApiError(error: unknown, fallback: string) {
    if (error instanceof ApiRequestError) {
      setMessage(error.message);
      setErrors(error.errors);
      return;
    }

    setMessage(fallback);
  }

  function closeGuide() {
    localStorage.setItem(guideStorageKeys.projectSeen, "1");
    localStorage.removeItem(guideStorageKeys.projectPendingId);
    if (isOnboardingActive()) {
      stopOnboarding();
    }
    setProjectInfoExpanded(false);
    setGuideOpen(false);
  }

  function completeProjectGuide() {
    localStorage.setItem(guideStorageKeys.projectSeen, "1");
    localStorage.removeItem(guideStorageKeys.projectPendingId);
    setProjectInfoExpanded(false);
    setGuideOpen(false);

    if (isOnboardingActive()) {
      setAiSettings((current) => ({
        ...current,
        planMode: "pipeline",
      }));
      setAiOpen(true);
      setAiGuideOpen(true);
    }
  }

  function closeAiGuide() {
    localStorage.setItem(guideStorageKeys.aiSuggestSeen, "1");
    if (isOnboardingActive()) {
      stopOnboarding();
    }
    setAiGuideOpen(false);
  }

  function completeAiGuide() {
    localStorage.setItem(guideStorageKeys.aiSuggestSeen, "1");
    stopOnboarding();
    setAiGuideOpen(false);
  }

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project) {
      return;
    }

    setBusy(true);
    clearFeedback();

    try {
      const payload = await apiRequest<Project | { data: Project }>(
        `/projects/${project.id}`,
        {
          method: "PUT",
          body: {
            name: projectForm.name,
            description: projectForm.description || null,
            icon: projectForm.icon,
            deadline: projectForm.deadline,
            available_minutes_per_day: Number(
              projectForm.available_minutes_per_day,
            ),
          },
        },
      );
      setProject(unwrapResource(payload));
      setProjectInfoExpanded(false);
    } catch (error) {
      handleApiError(error, t.project.updateProjectError);
    } finally {
      setBusy(false);
    }
  }

  async function deleteProject() {
    if (!project) {
      return;
    }

    setBusy(true);
    clearFeedback();

    try {
      await apiRequest(`/projects/${project.id}`, { method: "DELETE" });
      router.replace("/projects");
    } catch (error) {
      handleApiError(error, t.project.deleteProjectError);
      setBusy(false);
    }
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || !taskForm.title.trim()) {
      return;
    }

    setBusy(true);
    clearFeedback();

    try {
      await apiRequest(`/projects/${project.id}/tasks`, {
        method: "POST",
        body: {
          title: taskForm.title.trim(),
          description: taskForm.description || null,
          status: taskForm.status,
          priority: taskForm.priority,
          deadline: taskForm.deadline || null,
          estimated_minutes: taskForm.estimated_minutes
            ? Number(taskForm.estimated_minutes)
            : null,
        },
      });
      setTaskForm(emptyTaskForm);
      await loadProject();
    } catch (error) {
      handleApiError(error, t.project.createTaskError);
    } finally {
      setBusy(false);
    }
  }

  async function updateTask(task: Task, updates: TaskUpdate) {
    clearFeedback();

    try {
      await apiRequest(`/tasks/${task.id}`, {
        method: "PUT",
        body: {
          title: updates.title ?? task.title,
          description:
            updates.description === undefined
              ? task.description
              : updates.description,
          status: updates.status ?? task.status,
          priority: updates.priority ?? task.priority,
          deadline: updates.deadline === undefined ? task.deadline : updates.deadline,
          estimated_minutes:
            updates.estimated_minutes === undefined
              ? task.estimated_minutes
              : updates.estimated_minutes,
        },
      });
      await loadProject();
    } catch (error) {
      handleApiError(error, t.project.updateTaskError);
    }
  }

  async function deleteTask(task: Task) {
    clearFeedback();

    try {
      await apiRequest(`/tasks/${task.id}`, { method: "DELETE" });
      await loadProject();
    } catch (error) {
      handleApiError(error, t.project.deleteTaskError);
    }
  }

  async function createSubtask(
    task: Task,
    input: {
      title: string;
      description: string | null;
      status: "todo" | "done";
      estimated_minutes: number | null;
      scheduled_date: string | null;
    },
  ) {
    clearFeedback();

    try {
      await apiRequest(`/tasks/${task.id}/subtasks`, {
        method: "POST",
        body: input,
      });
      await loadProject();
    } catch (error) {
      handleApiError(error, t.project.createSubtaskError);
    }
  }

  async function updateSubtask(subtask: Subtask, updates: Partial<Subtask>) {
    clearFeedback();

    try {
      await apiRequest(`/subtasks/${subtask.id}`, {
        method: "PUT",
        body: {
          title: updates.title ?? subtask.title,
          status: updates.status ?? subtask.status,
          description:
            updates.description === undefined
              ? subtask.description
              : updates.description,
          estimated_minutes:
            updates.estimated_minutes === undefined
              ? subtask.estimated_minutes
              : updates.estimated_minutes,
          scheduled_date:
            updates.scheduled_date === undefined
              ? subtask.scheduled_date
              : updates.scheduled_date,
        },
      });
      await loadProject();
    } catch (error) {
      handleApiError(error, t.project.updateSubtaskError);
    }
  }

  async function deleteSubtask(subtask: Subtask) {
    clearFeedback();

    try {
      await apiRequest(`/subtasks/${subtask.id}`, { method: "DELETE" });
      await loadProject();
    } catch (error) {
      handleApiError(error, t.project.deleteSubtaskError);
    }
  }

  async function requestAiBreakdown(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || !aiGoal.trim()) {
      return;
    }

    setAiLoading(true);
    setAiMessage(null);
    setAiSuggestions([]);
    const { minTasks, maxTasks, minSubtasks, maxSubtasks } =
      normalizedAiCounts(aiSettings);

    try {
      const payload = await apiRequest<{ tasks: AiSuggestion[] }>(
        `/projects/${project.id}/ai-breakdown`,
        {
          method: "POST",
          body: {
            goal: aiGoal.trim(),
            deadline: project.deadline,
            available_minutes_per_day: project.available_minutes_per_day,
            language: preferences.language,
            planning_profile: aiSettings.planningProfile,
            ai_style: aiSettings.aiStyle,
            plan_mode: aiSettings.planMode,
            recurrence_cycles: boundedAiCount(aiSettings.recurrenceCycles, 4),
            feedback: aiSettings.feedback.trim() || null,
            create_subtasks: aiSettings.createSubtasks,
            min_tasks: minTasks,
            max_tasks: maxTasks,
            min_subtasks: minSubtasks,
            max_subtasks: maxSubtasks,
          },
        },
      );
      setAiSuggestions(payload.tasks);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setAiMessage(error.message);
      } else {
        setAiMessage(t.project.requestAiError);
      }
    } finally {
      setAiLoading(false);
    }
  }

  async function saveAiSuggestions() {
    if (!project || aiSuggestions.length === 0) {
      return;
    }

    setAiLoading(true);
    setAiMessage(null);

    try {
      await apiRequest<Project | { data: Project }>(
        `/projects/${project.id}/ai-breakdown/confirm`,
        {
          method: "POST",
          body: {
            recurrence_cycles: boundedAiCount(aiSettings.recurrenceCycles, 4),
            tasks: aiSuggestions.map((suggestion) => ({
              title: suggestion.title,
              phase: suggestion.phase,
              description: suggestion.description,
              priority: suggestion.priority,
              deadline: suggestion.deadline,
              estimated_minutes: suggestion.estimated_minutes,
              repeat_weekly: suggestion.repeat_weekly,
              subtasks: aiSettings.createSubtasks
                ? suggestion.subtasks.map((subtask) => ({
                title: subtask.title,
                description: subtask.description,
                estimated_minutes: subtask.estimated_minutes,
                scheduled_date: subtask.scheduled_date,
                  }))
                : [],
            })),
          },
        },
      );

      setAiOpen(false);
      setAiSuggestions([]);
      if (aiSettings.createSubtasks && aiSettings.autoSchedule) {
        try {
          const payload = await apiRequest<ScheduleResponse>(
            `/projects/${project.id}/generate-schedule`,
            { method: "POST" },
          );
          setGeneratedSchedule(payload.schedule);
        } catch {
          setMessage(t.project.autoScheduleError);
        }
      }
      await loadProject();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setAiMessage(error.message);
      } else {
        setAiMessage(t.project.saveAiError);
      }
    } finally {
      setAiLoading(false);
    }
  }

  async function repromptAiSuggestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || !repromptTarget || !repromptFeedback.trim()) {
      return;
    }

    const suggestion = aiSuggestions[repromptTarget.suggestionIndex];
    if (!suggestion) {
      return;
    }

    const currentSubtask =
      repromptTarget.type === "subtask"
        ? suggestion.subtasks[repromptTarget.subtaskIndex]
        : undefined;
    if (repromptTarget.type === "subtask" && !currentSubtask) {
      return;
    }

    setRepromptLoading(true);
    setAiMessage(null);
    const { minSubtasks, maxSubtasks } = normalizedAiCounts(aiSettings);

    try {
      const payload = await apiRequest<{ tasks: AiSuggestion[] }>(
        `/projects/${project.id}/ai-breakdown`,
        {
          method: "POST",
          body: {
            goal: aiGoal.trim(),
            deadline: project.deadline,
            available_minutes_per_day: project.available_minutes_per_day,
            language: preferences.language,
            planning_profile: aiSettings.planningProfile,
            ai_style: aiSettings.aiStyle,
            plan_mode: aiSettings.planMode,
            recurrence_cycles: boundedAiCount(aiSettings.recurrenceCycles, 4),
            feedback: aiSettings.feedback.trim() || null,
            create_subtasks:
              repromptTarget.type === "subtask" || aiSettings.createSubtasks,
            min_tasks: 1,
            max_tasks: 1,
            min_subtasks:
              repromptTarget.type === "subtask" ? 1 : minSubtasks,
            max_subtasks:
              repromptTarget.type === "subtask" ? 1 : maxSubtasks,
            current_task: suggestion,
            current_subtask: currentSubtask,
            reprompt_feedback: repromptFeedback.trim(),
          },
        },
      );
      const replacement = payload.tasks[0];

      if (!replacement) {
        throw new Error("AI did not return a replacement task.");
      }

      if (repromptTarget.type === "task") {
        setAiSuggestions((current) =>
          current.map((item, index) =>
            index === repromptTarget.suggestionIndex ? replacement : item,
          ),
        );
      } else {
        const replacementSubtask = replacement.subtasks[0] as
          | AiSuggestedSubtask
          | undefined;

        if (!replacementSubtask) {
          throw new Error("AI did not return a replacement subtask.");
        }

        setAiSuggestions((current) =>
          current.map((item, suggestionIndex) => {
            if (suggestionIndex !== repromptTarget.suggestionIndex) {
              return item;
            }

            const subtasks = item.subtasks.map((subtask, subtaskIndex) =>
              subtaskIndex === repromptTarget.subtaskIndex
                ? replacementSubtask
                : subtask,
            );

            return {
              ...item,
              subtasks,
              estimated_minutes: subtasks.reduce(
                (total, subtask) => total + subtask.estimated_minutes,
                0,
              ),
            };
          }),
        );
      }

      setRepromptTarget(null);
      setRepromptFeedback("");
    } catch (error) {
      setAiMessage(
        error instanceof ApiRequestError
          ? error.message
          : repromptTarget.type === "subtask"
            ? t.project.repromptSubtaskError
            : t.project.repromptError,
      );
    } finally {
      setRepromptLoading(false);
    }
  }

  const filteredTasks = useMemo(() => {
    if (!project) {
      return [];
    }

    return project.tasks.filter((task) => {
      if (filters.status && task.status !== filters.status) {
        return false;
      }

      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }

      if (filters.deadline && (!task.deadline || task.deadline > filters.deadline)) {
        return false;
      }

      return true;
    });
  }, [filters, project]);

  const scheduleDays = useMemo(() => {
    if (!project) {
      return [];
    }

    return generatedSchedule ?? buildScheduleFromProject(project);
  }, [generatedSchedule, project]);

  return (
    <RequireAuth>
      <AppShell
        title={project?.name ?? t.project.fallbackTitle}
        description={project?.description ?? t.project.fallbackDescription}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setProjectInfoExpanded(true);
                setGuideOpen(true);
              }}
            >
              <CircleHelp className="h-4 w-4" />
              {t.common.guide}
            </Button>
            <Link href="/projects">
              <Button type="button" variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                {t.common.projects}
              </Button>
            </Link>
            {project ? (
              <Button
                type="button"
                variant="danger"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={busy}
              >
                <Trash2 className="h-4 w-4" />
                {t.common.delete}
              </Button>
            ) : null}
          </div>
        }
      >
        {loading ? <LoadingState label={t.project.loading} /> : null}
        <ErrorMessage message={message} errors={errors} />

        {!loading && project ? (
          <div className="grid gap-6">
            <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
              <Card data-guide="project-info">
                <CardHeader className={projectInfoExpanded ? "p-0" : "border-b-0 p-0"}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-slate-50"
                    onClick={() => setProjectInfoExpanded((current) => !current)}
                    aria-expanded={projectInfoExpanded}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-cyan-50 text-cyan-700">
                      <ProjectIcon icon={project.icon} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-950">
                        {t.project.projectInformation}
                      </span>
                      <span className="mt-1 block line-clamp-2 text-sm leading-5 text-slate-600">
                        {project.description || t.common.noDescription}
                      </span>
                      <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                        <span>{t.project.deadline}: {formatDate(project.deadline, preferences.dateFormat)}</span>
                        <span>{project.available_minutes_per_day} {t.common.minPerDay}</span>
                      </span>
                    </span>
                    {projectInfoExpanded ? (
                      <ChevronUp className="mt-1 h-5 w-5 shrink-0 text-slate-500" />
                    ) : (
                      <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-slate-500" />
                    )}
                  </button>
                </CardHeader>
                {projectInfoExpanded ? (
                  <CardContent>
                  <form onSubmit={saveProject} className="grid gap-4">
                    <Input
                      label={t.project.name}
                      value={projectForm.name}
                      onChange={(event) =>
                        setProjectForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      required
                    />
                    <ProjectIconPicker
                      label={t.project.icon}
                      value={projectForm.icon}
                      onChange={(icon) =>
                        setProjectForm((current) => ({
                          ...current,
                          icon,
                        }))
                      }
                    />
                    <Textarea
                      label={t.project.description}
                      value={projectForm.description}
                      placeholder={t.newProject.descriptionPlaceholder}
                      onChange={(event) =>
                        setProjectForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label={t.project.deadline}
                        type="date"
                        value={projectForm.deadline}
                        onChange={(event) =>
                          setProjectForm((current) => ({
                            ...current,
                            deadline: event.target.value,
                          }))
                        }
                        required
                      />
                      <Input
                        label={t.project.minutesPerDay}
                        type="number"
                        min={15}
                        max={720}
                        value={projectForm.available_minutes_per_day}
                        onChange={(event) =>
                          setProjectForm((current) => ({
                            ...current,
                            available_minutes_per_day: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <Button type="submit" className="w-fit" disabled={busy}>
                      <Save className="h-4 w-4" />
                      {t.common.saveChanges}
                    </Button>
                  </form>
                  </CardContent>
                ) : null}
              </Card>

              <div className="grid gap-4">
                <Card data-guide="project-actions">
                  <CardContent className="grid gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-slate-950">
                          {t.project.aiBreakdown}
                        </h2>
                        <p className="mt-1 text-sm leading-5 text-slate-500">
                          {t.project.aiCallout}
                        </p>
                      </div>
                      <Badge tone="info">
                        {project.available_minutes_per_day} {t.common.minPerDay}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="accent"
                      className="h-12 w-full"
                      onClick={() => setAiOpen(true)}
                    >
                      <Sparkles className="h-4 w-4" />
                      {t.project.aiBreakdown}
                    </Button>
                  </CardContent>
                </Card>

                <Card data-guide="new-task">
                  <CardContent>
                    <h2 className="text-base font-semibold text-slate-950">
                      {t.project.newTask}
                    </h2>
                    <form onSubmit={createTask} className="mt-4 grid gap-3">
                      <Input
                        label={t.common.title}
                        value={taskForm.title}
                        onChange={(event) =>
                          setTaskForm((current) => ({
                            ...current,
                            title: event.target.value,
                          }))
                        }
                        required
                      />
                      <Textarea
                        label={t.project.description}
                        value={taskForm.description}
                        onChange={(event) =>
                          setTaskForm((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Select
                          label={t.common.priority}
                          value={taskForm.priority}
                          onChange={(event) =>
                            setTaskForm((current) => ({
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
                          value={taskForm.estimated_minutes}
                          onChange={(event) =>
                            setTaskForm((current) => ({
                              ...current,
                              estimated_minutes: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <Input
                        label={t.project.deadline}
                        type="date"
                        min={todayDateInputValue()}
                        max={project.deadline}
                        value={taskForm.deadline}
                        onChange={(event) =>
                          setTaskForm((current) => ({
                            ...current,
                            deadline: event.target.value,
                          }))
                        }
                      />
                      <Button type="submit" disabled={busy}>
                        <Plus className="h-4 w-4" />
                        {t.project.addTask}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section
              data-guide="project-workspace"
              className="grid gap-4 lg:grid-cols-[1fr_420px]"
            >
              <div
                data-guide="task-completion"
                className="grid content-start gap-4"
              >
                <Card>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Select
                        label={t.common.status}
                        value={filters.status}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            status: event.target.value,
                          }))
                        }
                      >
                        <option value="">{t.common.all}</option>
                        <option value="todo">{t.status.todo}</option>
                        <option value="in_progress">{t.status.in_progress}</option>
                        <option value="done">{t.status.done}</option>
                      </Select>
                      <Select
                        label={t.common.priority}
                        value={filters.priority}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            priority: event.target.value,
                          }))
                        }
                      >
                        <option value="">{t.common.all}</option>
                        <option value="low">{t.priority.low}</option>
                        <option value="medium">{t.priority.medium}</option>
                        <option value="high">{t.priority.high}</option>
                      </Select>
                      <Input
                        label={t.project.dueBefore}
                        type="date"
                        value={filters.deadline}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            deadline: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {filteredTasks.length === 0 ? (
                  <EmptyState
                    title={t.project.noTasksMatch}
                    description={t.project.noTasksDescription}
                  />
                ) : (
                  filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      projectDeadline={project.deadline}
                      onTaskChange={updateTask}
                      onDeleteTask={deleteTask}
                      onCreateSubtask={createSubtask}
                      onUpdateSubtask={updateSubtask}
                      onDeleteSubtask={deleteSubtask}
                    />
                  ))
                )}
              </div>

              <div>
                <h2 className="mb-3 text-base font-semibold text-slate-950">
                  {t.project.scheduleView}
                </h2>
                <ScheduleList
                  days={scheduleDays}
                  dailyCapacity={project.available_minutes_per_day}
                />
              </div>
            </section>
          </div>
        ) : null}

        <Modal
          open={deleteConfirmOpen}
          title={t.project.deleteProjectTitle}
          onClose={() => setDeleteConfirmOpen(false)}
        >
          <div className="grid gap-5">
            <div className="flex gap-3 rounded-md border border-rose-200 bg-rose-50 p-4 text-rose-950">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
              <div className="grid gap-1 text-sm leading-6">
                <p className="font-semibold">{t.project.deleteProjectWarning}</p>
                <p>{t.project.deleteProjectDescription}</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={busy}
              >
                {t.common.cancel}
              </Button>
              <Button type="button" variant="danger" onClick={deleteProject} disabled={busy}>
                <Trash2 className="h-4 w-4" />
                {busy ? t.project.deletingProject : t.common.delete}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          open={aiOpen}
          title={t.project.aiBreakdown}
          onClose={() => {
            setAiGuideOpen(false);
            setRepromptTarget(null);
            setRepromptFeedback("");
            setAiOpen(false);
          }}
        >
          <form onSubmit={requestAiBreakdown} className="grid gap-4">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                className="h-9"
                onClick={() => setAiGuideOpen(true)}
              >
                <CircleHelp className="h-4 w-4" />
                {t.common.guide}
              </Button>
            </div>
            <ErrorMessage message={aiMessage} />
            <div data-guide="ai-goal">
              <Textarea
                label={t.project.goal}
                value={aiGoal}
                onChange={(event) => setAiGoal(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
              <h3 className="text-sm font-semibold text-slate-950">
                {t.project.aiSettings}
              </h3>
              <div
                data-guide="ai-profile-style"
                className="grid gap-3 sm:grid-cols-2"
              >
                <Select
                  label={t.project.planningProfile}
                  value={aiSettings.planningProfile}
                  onChange={(event) =>
                    setAiSettings((current) => ({
                      ...current,
                      planningProfile: event.target
                        .value as AiSettings["planningProfile"],
                    }))
                  }
                >
                  <option value="portfolio">{t.project.portfolio}</option>
                  <option value="study">{t.project.study}</option>
                  <option value="work">{t.project.work}</option>
                  <option value="personal">{t.project.personal}</option>
                </Select>
                <Select
                  label={t.project.aiStyle}
                  value={aiSettings.aiStyle}
                  onChange={(event) =>
                    setAiSettings((current) => ({
                      ...current,
                      aiStyle: event.target.value as AiSettings["aiStyle"],
                    }))
                  }
                >
                  <option value="concise">{t.project.concise}</option>
                  <option value="detailed">{t.project.detailed}</option>
                  <option value="coach">{t.project.coach}</option>
                </Select>
              </div>
              <div data-guide="ai-plan-mode" className="grid gap-3">
                <Select
                  label={t.project.planMode}
                  value={aiSettings.planMode}
                  onChange={(event) =>
                    setAiSettings((current) => ({
                      ...current,
                      planMode: event.target.value as AiSettings["planMode"],
                    }))
                  }
                >
                  <option value="phased">{t.project.phasedPlan}</option>
                  <option value="recurring">{t.project.recurringPlan}</option>
                  <option value="pipeline">{t.project.pipelinePlan}</option>
                </Select>
              {aiSettings.planMode === "recurring" ? (
                <Input
                  label={t.project.recurrenceCycles}
                  type="number"
                  min={1}
                  max={12}
                  value={aiSettings.recurrenceCycles}
                  onChange={(event) =>
                    setAiSettings((current) => ({
                      ...current,
                      recurrenceCycles: event.target.value,
                    }))
                  }
                />
              ) : null}
              {aiSettings.planMode === "pipeline" ? (
                <div className="grid gap-1">
                  <Textarea
                    label={t.project.feedback}
                    value={aiSettings.feedback}
                    onChange={(event) =>
                      setAiSettings((current) => ({
                        ...current,
                        feedback: event.target.value,
                      }))
                    }
                  />
                  <p className="text-xs leading-5 text-slate-500">
                    {t.project.feedbackHint}
                  </p>
                </div>
              ) : null}
              </div>
              <div data-guide="ai-work-limits" className="grid gap-3">
                <p className="text-sm font-semibold text-slate-800">
                  {t.project.taskSettings}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label={t.project.minTasks}
                    type="number"
                    min={1}
                    max={12}
                    value={aiSettings.minTasks}
                    onChange={(event) =>
                      setAiSettings((current) => ({
                        ...current,
                        minTasks: event.target.value,
                      }))
                    }
                  />
                  <Input
                    label={t.project.maxTasks}
                    type="number"
                    min={1}
                    max={12}
                    value={aiSettings.maxTasks}
                    onChange={(event) =>
                      setAiSettings((current) => ({
                        ...current,
                        maxTasks: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-3 border-t border-slate-200 pt-3">
                <p className="text-sm font-semibold text-slate-800">
                  {t.project.subtaskSettings}
                </p>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-500"
                  checked={aiSettings.createSubtasks}
                  onChange={(event) =>
                    setAiSettings((current) => ({
                      ...current,
                      createSubtasks: event.target.checked,
                    }))
                  }
                />
                {t.project.createSubtasksOnSave}
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label={t.project.minSubtasks}
                  type="number"
                  min={1}
                  max={12}
                  value={aiSettings.minSubtasks}
                  disabled={!aiSettings.createSubtasks}
                  onChange={(event) =>
                    setAiSettings((current) => ({
                      ...current,
                      minSubtasks: event.target.value,
                    }))
                  }
                />
                <Input
                  label={t.project.maxSubtasks}
                  type="number"
                  min={1}
                  max={12}
                  value={aiSettings.maxSubtasks}
                  disabled={!aiSettings.createSubtasks}
                  onChange={(event) =>
                    setAiSettings((current) => ({
                      ...current,
                      maxSubtasks: event.target.value,
                    }))
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-500 disabled:opacity-50"
                  checked={aiSettings.autoSchedule && aiSettings.createSubtasks}
                  disabled={!aiSettings.createSubtasks}
                  onChange={(event) =>
                    setAiSettings((current) => ({
                      ...current,
                      autoSchedule: event.target.checked,
                    }))
                  }
                />
                {t.project.scheduleAfterSaving}
              </label>
              </div>
            </div>
            <div data-guide="ai-generate" className="w-fit">
              <Button type="submit" disabled={aiLoading}>
                <Sparkles className="h-4 w-4" />
                {t.project.generateSuggestions}
              </Button>
            </div>
          </form>

          {aiSuggestions.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {aiSuggestions.map((suggestion, suggestionIndex) => (
                <div
                  key={`${suggestion.title}-${suggestion.estimated_minutes}`}
                  className="grid gap-3 rounded-md border border-slate-200 bg-white px-3 py-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {suggestion.title}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-cyan-700">
                        {suggestion.phase}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {suggestion.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Badge
                        tone={
                          suggestion.priority === "high"
                            ? "danger"
                            : suggestion.priority === "medium"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {t.priority[suggestion.priority]}
                      </Badge>
                      <Badge tone="neutral">
                        {suggestion.subtasks.length} {t.project.subtasks}
                      </Badge>
                      <span className="text-sm text-slate-500">
                        {suggestion.estimated_minutes} {t.common.min}
                      </span>
                      <span className="text-sm text-slate-500">
                        {t.common.due} {formatDate(suggestion.deadline, preferences.dateFormat)}
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-9 px-3"
                        onClick={() => {
                          setRepromptTarget({
                            type: "task",
                            suggestionIndex,
                          });
                          setRepromptFeedback("");
                        }}
                        disabled={repromptLoading}
                      >
                        <RefreshCw className="h-4 w-4" />
                        {t.project.repromptTask}
                      </Button>
                    </div>
                  </div>
                  {suggestion.subtasks.length > 0 ? (
                    <ol className="grid gap-2 border-t border-slate-100 pt-3">
                      {suggestion.subtasks.map((subtask, index) => (
                        <li
                          key={`${suggestion.title}-${subtask.title}-${index}`}
                          className="flex items-start gap-3 text-sm text-slate-700"
                        >
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1 leading-6">
                            <p className="font-medium text-slate-800">
                              {subtask.title}
                            </p>
                            <p className="mt-1 text-slate-600">
                              {subtask.description}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {subtask.estimated_minutes} {t.common.min}
                              {" - "}
                              {formatDate(
                                subtask.scheduled_date,
                                preferences.dateFormat,
                              )}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            className="h-9 w-9 shrink-0 px-0"
                            aria-label={t.project.repromptSubtask}
                            title={t.project.repromptSubtask}
                            onClick={() => {
                              setRepromptTarget({
                                type: "subtask",
                                suggestionIndex,
                                subtaskIndex: index,
                              });
                              setRepromptFeedback("");
                            }}
                            disabled={repromptLoading}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </div>
              ))}
              <Button
                type="button"
                className="w-fit"
                onClick={saveAiSuggestions}
                disabled={aiLoading || repromptLoading}
              >
                <Save className="h-4 w-4" />
                {t.project.saveSuggestions}
              </Button>
            </div>
          ) : null}
        </Modal>
        <Modal
          open={repromptTarget !== null}
          title={
            repromptTarget?.type === "subtask"
              ? t.project.repromptSubtaskDialogTitle
              : t.project.repromptTaskDialogTitle
          }
          onClose={() => {
            if (!repromptLoading) {
              setRepromptTarget(null);
              setRepromptFeedback("");
            }
          }}
        >
          <form onSubmit={repromptAiSuggestion} className="grid gap-4">
            <p className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm leading-6 text-cyan-950">
              {t.project.repromptMemoryNotice}
            </p>
            <Textarea
              label={t.project.repromptLabel}
              value={repromptFeedback}
              placeholder={
                repromptTarget?.type === "subtask"
                  ? t.project.repromptSubtaskPlaceholder
                  : t.project.repromptPlaceholder
              }
              onChange={(event) => setRepromptFeedback(event.target.value)}
              required
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setRepromptTarget(null);
                  setRepromptFeedback("");
                }}
                disabled={repromptLoading}
              >
                {t.common.cancel}
              </Button>
              <Button
                type="submit"
                disabled={repromptLoading || !repromptFeedback.trim()}
              >
                <RefreshCw
                  className={
                    repromptLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"
                  }
                />
                {t.project.applyReprompt}
              </Button>
            </div>
          </form>
        </Modal>
        {guideOpen ? (
          <GuideOverlay
            open={guideOpen}
            onClose={closeGuide}
            onComplete={completeProjectGuide}
            steps={getProjectGuideSteps(preferences.language)}
          />
        ) : null}
        {aiGuideOpen ? (
          <GuideOverlay
            open={aiGuideOpen}
            onClose={closeAiGuide}
            onComplete={completeAiGuide}
            steps={getAiSuggestGuideSteps(preferences.language)}
          />
        ) : null}
      </AppShell>
    </RequireAuth>
  );
}

function buildScheduleFromProject(project: Project): ScheduleDay[] {
  const days = new Map<string, ScheduleDay>();

  for (const task of project.tasks) {
    for (const subtask of task.subtasks) {
      if (!subtask.scheduled_date) {
        continue;
      }

      const item: ScheduleSubtask = {
        id: subtask.id,
        title: subtask.title,
        task_id: task.id,
        task_title: task.title,
        priority: task.priority,
        estimated_minutes: subtask.estimated_minutes ?? 30,
      };

      const day = days.get(subtask.scheduled_date) ?? {
        date: subtask.scheduled_date,
        used_minutes: 0,
        subtasks: [],
      };

      day.used_minutes += item.estimated_minutes;
      day.subtasks.push(item);
      days.set(subtask.scheduled_date, day);
    }
  }

  return Array.from(days.values()).sort((first, second) =>
    first.date.localeCompare(second.date),
  );
}
