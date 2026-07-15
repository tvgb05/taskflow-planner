"use client";

/* eslint-disable react-hooks/set-state-in-effect -- The first-run guide hydrates from localStorage after mount. */

import { ArrowLeft, CircleHelp, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { AppShell, RequireAuth } from "@/components/taskflow/AppShell";
import {
  getNewProjectGuideSteps,
  GuideOverlay,
} from "@/components/taskflow/GuideOverlay";
import {
  defaultProjectIcon,
  ProjectIconPicker,
  type ProjectIconKey,
} from "@/components/taskflow/ProjectIcon";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";
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
import type {
  PlanningMode,
  Project,
  ProjectType,
  ValidationErrors,
} from "@/lib/types";

export default function NewProjectPage() {
  const router = useRouter();
  const { preferences } = usePreferences();
  const t = useAppText();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<ProjectIconKey>(defaultProjectIcon);
  const [projectType, setProjectType] =
    useState<ProjectType>("short_term");
  const [planningMode, setPlanningMode] =
    useState<PlanningMode>("phased");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [availableMinutes, setAvailableMinutes] = useState("120");
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("guide") === "create-project";
    const seen = localStorage.getItem(guideStorageKeys.newProjectSeen) === "1";

    if (requested || !seen) {
      setGuideOpen(true);
    }
  }, []);

  function closeGuide() {
    localStorage.setItem(guideStorageKeys.newProjectSeen, "1");
    if (isOnboardingActive()) {
      stopOnboarding();
    }
    setGuideOpen(false);
  }

  function completeGuide() {
    localStorage.setItem(guideStorageKeys.newProjectSeen, "1");
    setGuideOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setErrors(undefined);

    try {
      const payload = await apiRequest<Project | { data: Project }>("/projects", {
        method: "POST",
        body: {
          name,
          description: description || null,
          icon,
          project_type: projectType,
          planning_mode: planningMode,
          deadline,
          available_minutes_per_day: Number(availableMinutes),
        },
      });
      const project = unwrapResource(payload);
      if (localStorage.getItem(guideStorageKeys.projectSeen) !== "1") {
        localStorage.setItem(
          guideStorageKeys.projectPendingId,
          String(project.id),
        );
      }
      router.replace(`/projects/${project.id}`);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setMessage(error.message);
        setErrors(error.errors);
      } else {
        setMessage(t.newProject.createError);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <RequireAuth>
      <AppShell
        title={t.newProject.title}
        description={t.newProject.description}
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
            <Link href="/projects">
              <Button type="button" variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                {t.common.projects}
              </Button>
            </Link>
          </div>
        }
      >
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid max-w-2xl gap-4">
              <ErrorMessage message={message} errors={errors} />
              <div data-guide="new-project-name">
                <Input
                  label={t.newProject.projectName}
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <ProjectIconPicker
                label={t.project.icon}
                value={icon}
                onChange={setIcon}
              />
              <Select
                label={t.project.projectType}
                value={projectType}
                onChange={(event) => {
                  const nextType = event.target.value as ProjectType;
                  setProjectType(nextType);
                  if (nextType === "daily_recurring") {
                    setPlanningMode("recurring");
                  }
                }}
                required
              >
                <option value="short_term">{t.project.shortTerm}</option>
                <option value="long_term">{t.project.longTerm}</option>
                <option value="daily_recurring">
                  {t.project.dailyRecurring}
                </option>
              </Select>
              <Select
                label={t.project.planMode}
                value={planningMode}
                onChange={(event) =>
                  setPlanningMode(event.target.value as PlanningMode)
                }
                required
              >
                <option value="phased">{t.project.phasedPlan}</option>
                <option value="recurring">{t.project.recurringPlan}</option>
                <option value="pipeline">{t.project.pipelinePlan}</option>
              </Select>
              <div data-guide="new-project-description">
                <Textarea
                  label={t.newProject.descriptionLabel}
                  name="description"
                  value={description}
                  placeholder={t.newProject.descriptionPlaceholder}
                  rows={8}
                  onChange={(event) => setDescription(event.target.value)}
                />
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {t.newProject.descriptionHint}
                </p>
              </div>
              <div
                data-guide="new-project-timing"
                className="grid gap-4 sm:grid-cols-2"
              >
                <Input
                  label={t.newProject.deadline}
                  name="deadline"
                  type="date"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                  required
                />
                <Input
                  label={t.newProject.availableMinutes}
                  name="available_minutes_per_day"
                  type="number"
                  min={15}
                  max={720}
                  value={availableMinutes}
                  onChange={(event) => setAvailableMinutes(event.target.value)}
                  required
                />
              </div>
              <div data-guide="new-project-save">
                <Button type="submit" className="w-fit" disabled={submitting}>
                  <Save className="h-4 w-4" />
                  {t.newProject.saveProject}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        {guideOpen ? (
          <GuideOverlay
            open={guideOpen}
            onClose={closeGuide}
            onComplete={completeGuide}
            steps={getNewProjectGuideSteps(preferences.language)}
          />
        ) : null}
      </AppShell>
    </RequireAuth>
  );
}
