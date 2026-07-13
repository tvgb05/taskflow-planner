"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell, RequireAuth } from "@/components/taskflow/AppShell";
import { ProjectCard } from "@/components/taskflow/ProjectCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { apiRequest, unwrapCollection } from "@/lib/api";
import { useAppText } from "@/lib/i18n";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const t = useAppText();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<Project[] | { data: Project[] }>("/projects")
      .then((payload) => setProjects(unwrapCollection(payload)))
      .catch(() => setError(t.projects.loadError))
      .finally(() => setLoading(false));
  }, [t.projects.loadError]);

  return (
    <RequireAuth>
      <AppShell
        title={t.projects.title}
        description={t.projects.description}
        action={
          <Link href="/projects/new">
            <Button type="button">
              <Plus className="h-4 w-4" />
              {t.common.newProject}
            </Button>
          </Link>
        }
      >
        {loading ? <LoadingState label={t.projects.loading} /> : null}
        {error ? <ErrorMessage message={error} /> : null}
        {!loading && !error && projects.length === 0 ? (
          <EmptyState
            title={t.projects.emptyTitle}
            description={t.projects.emptyDescription}
            action={
              <Link href="/projects/new">
                <Button type="button">{t.common.createProject}</Button>
              </Link>
            }
          />
        ) : null}
        {!loading && !error && projects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : null}
      </AppShell>
    </RequireAuth>
  );
}
