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
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6">
      <div
        className="w-full max-w-3xl rounded-md bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-slate-950">
            {title}
          </h2>
          {showCloseButton ? (
            <Button
              type="button"
              variant="ghost"
              className={cn(
                iconOnlyButtonStyles,
                "h-9 w-9 text-base font-bold leading-none text-slate-700",
              )}
              onClick={onClose}
              aria-label={t.modal.close}
              title={t.modal.close}
            >
              X
            </Button>
          ) : null}
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
