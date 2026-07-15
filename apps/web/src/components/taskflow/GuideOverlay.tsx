"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getAppText, useAppText } from "@/lib/i18n";
import type { AppLanguage } from "@/lib/preferences";
import { cn } from "@/lib/utils";

export type GuideStep = {
  title: string;
  description: string;
  target: string;
  details?: readonly string[];
};

const dashboardGuideTargets = [
  "[data-guide='new-project']",
  "[data-guide='dashboard-metrics']",
  "[data-guide='dashboard-work']",
];

const newProjectGuideTargets = [
  "[data-guide='new-project-name']",
  "[data-guide='new-project-description']",
  "[data-guide='new-project-timing']",
  "[data-guide='new-project-save']",
];

const projectGuideTargets = [
  "[data-guide='project-info']",
  "[data-guide='project-actions']",
  "[data-guide='new-task']",
  "[data-guide='project-workspace']",
  "[data-guide='task-completion']",
];

const aiSuggestGuideTargets = [
  "[data-guide='ai-goal']",
  "[data-guide='ai-profile-style']",
  "[data-guide='ai-plan-mode']",
  "[data-guide='ai-work-limits']",
  "[data-guide='ai-generate']",
];

export function getDashboardGuideSteps(language: AppLanguage): GuideStep[] {
  return getAppText(language).guide.dashboardSteps.map((step, index) => ({
    ...step,
    target: dashboardGuideTargets[index],
  }));
}

export function getNewProjectGuideSteps(language: AppLanguage): GuideStep[] {
  return getAppText(language).guide.newProjectSteps.map((step, index) => ({
    ...step,
    target: newProjectGuideTargets[index],
  }));
}

export function getProjectGuideSteps(language: AppLanguage): GuideStep[] {
  return getAppText(language).guide.projectSteps.map((step, index) => ({
    ...step,
    target: projectGuideTargets[index],
  }));
}

export function getAiSuggestGuideSteps(language: AppLanguage): GuideStep[] {
  return getAppText(language).guide.aiSuggestSteps.map((step, index) => ({
    ...step,
    target: aiSuggestGuideTargets[index],
  }));
}

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export function GuideOverlay({
  open,
  onClose,
  onComplete,
  steps,
}: {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
  steps: GuideStep[];
}) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const step = steps[index];
  const t = useAppText();

  const tooltipStyle = useMemo(() => {
    if (!rect) {
      return { top: 96, left: 16 };
    }

    const gap = 12;
    const viewportWidth =
      typeof window === "undefined" ? 1280 : window.innerWidth;
    const viewportHeight =
      typeof window === "undefined" ? 720 : window.innerHeight;
    const width = Math.min(320, viewportWidth - 32);
    const estimatedHeight = 260;
    const fitsRight = rect.left + rect.width + gap + width < viewportWidth;
    const fitsLeft = rect.left - gap - width > 0;
    if (fitsRight || fitsLeft) {
      const left = fitsRight ? rect.left + rect.width + gap : rect.left - gap - width;
      const top = Math.max(
        16,
        Math.min(rect.top, viewportHeight - estimatedHeight - 16),
      );

      return { top, left, width };
    }

    const fitsBelow = rect.top + rect.height + gap + estimatedHeight < viewportHeight;
    const top = fitsBelow
      ? rect.top + rect.height + gap
      : Math.max(16, rect.top - gap - estimatedHeight);
    const left = Math.max(16, Math.min(rect.left, viewportWidth - width - 16));

    return { top, left, width };
  }, [rect]);

  useEffect(() => {
    if (!open || !step) {
      return;
    }

    function measure() {
      const target = document.querySelector(step.target);

      if (!target) {
        setRect(null);
        return;
      }

      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      window.requestAnimationFrame(() => {
        const bounds = target.getBoundingClientRect();
        setRect({
          top: bounds.top,
          left: bounds.left,
          width: bounds.width,
          height: bounds.height,
        });
      });
    }

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step]);

  if (!open || !step) {
    return null;
  }

  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {rect ? (
        <div
          className="absolute rounded-md border-2 border-cyan-500 shadow-[0_0_0_3px_rgba(6,182,212,0.18)] transition-all"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
          }}
        />
      ) : null}

      <div
        className={cn(
          "pointer-events-auto absolute rounded-md bg-cyan-700 p-4 text-white shadow-xl ring-1 ring-cyan-500/40",
          "max-w-[calc(100vw-32px)]",
        )}
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-cyan-100">
              {t.guide.step(index + 1, steps.length)}
            </p>
            <h2 className="mt-1 text-base font-semibold">{step.title}</h2>
          </div>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded border border-cyan-400/50 bg-cyan-800 text-base font-bold leading-none text-white hover:bg-cyan-600"
            onClick={onClose}
            aria-label={t.guide.close}
            title={t.guide.close}
          >
            X
          </button>
        </div>

        <p className="mt-2 text-sm leading-6 text-cyan-50">
          {step.description}
        </p>

        {step.details?.length ? (
          <ul className="mt-3 grid gap-1 text-sm text-cyan-50">
            {step.details.map((detail) => (
              <li key={detail} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-200" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-cyan-300 bg-cyan-900 px-4 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:pointer-events-none disabled:opacity-50"
            onClick={() => setIndex((current) => Math.max(0, current - 1))}
            disabled={isFirst}
          >
            <ChevronLeft className="h-4 w-4" />
            {t.common.back}
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white bg-white px-4 text-sm font-semibold text-cyan-900 transition hover:bg-cyan-50"
            onClick={() => {
              if (isLast) {
                (onComplete ?? onClose)();
                return;
              }

              setIndex((current) => current + 1);
            }}
          >
            {isLast ? t.guide.done : t.guide.next}
            {!isLast ? <ChevronRight className="h-4 w-4" /> : null}
          </button>
        </div>
      </div>
    </div>
  );
}
