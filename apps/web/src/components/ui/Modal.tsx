"use client";

import { Button } from "@/components/ui/Button";
import { useAppText } from "@/lib/i18n";

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const t = useAppText();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6">
      <div className="w-full max-w-3xl rounded-md bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <Button
            type="button"
            variant="ghost"
            className="h-9 w-9 px-0 text-base font-bold leading-none text-slate-700"
            onClick={onClose}
            aria-label={t.modal.close}
            title={t.modal.close}
          >
            X
          </Button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
