"use client";

import { useId } from "react";

import { Button, iconOnlyButtonStyles } from "@/components/ui/Button";
import { useAppText } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  title,
  children,
  onClose,
  showCloseButton = true,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  showCloseButton?: boolean;
}) {
  const t = useAppText();
  const titleId = useId();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-0 z-50 grid h-[var(--visual-viewport-height,100dvh)] items-end bg-slate-950/40 sm:place-items-center sm:px-4 sm:py-6">
      <div
        className="flex max-h-[calc(var(--visual-viewport-height,100dvh)-0.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-t-md bg-white shadow-xl dark:bg-slate-900 sm:max-h-[calc(100dvh-3rem)] sm:rounded-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 id={titleId} className="text-lg font-semibold text-slate-950 dark:text-slate-50">
            {title}
          </h2>
          {showCloseButton ? (
            <Button
              type="button"
              variant="ghost"
              className={cn(
                iconOnlyButtonStyles,
                "h-9 w-9 text-base font-bold leading-none text-slate-700 dark:text-slate-300",
              )}
              onClick={onClose}
              aria-label={t.modal.close}
              title={t.modal.close}
            >
              X
            </Button>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
