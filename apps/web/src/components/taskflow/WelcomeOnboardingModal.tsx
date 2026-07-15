"use client";

import { BrainCircuit, CheckCircle2, Sunrise } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAppText } from "@/lib/i18n";

export function WelcomeOnboardingModal({
  open,
  onStart,
  onSkip,
  busy,
}: {
  open: boolean;
  onStart: () => void;
  onSkip: () => void;
  busy?: boolean;
}) {
  const t = useAppText();
  const items = [
    { icon: Sunrise, ...t.guide.welcome.morning },
    { icon: BrainCircuit, ...t.guide.welcome.planning },
    { icon: CheckCircle2, ...t.guide.welcome.feedback },
  ];

  return (
    <Modal
      open={open}
      title={t.guide.welcome.title}
      onClose={onSkip}
    >
      <div className="grid gap-6">
        <p className="max-w-2xl text-base leading-7 text-slate-700">
          {t.guide.welcome.introduction}
        </p>

        <div className="grid gap-4 border-y border-slate-100 py-5">
          {items.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-cyan-50 text-cyan-700">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-950">
                  {title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm leading-6 text-slate-600">
          {t.guide.welcome.tourDescription}
        </p>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onSkip} disabled={busy}>
            {t.guide.welcome.skip}
          </Button>
          <Button type="button" onClick={onStart} disabled={busy}>
            {busy ? t.guide.welcome.creatingSampleGoal : t.guide.welcome.start}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
