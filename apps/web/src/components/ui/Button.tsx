import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "danger";

export const iconOnlyButtonStyles = "shrink-0 !px-0 [&>svg]:shrink-0";

export function buttonStyles(variant: ButtonVariant = "primary") {
  return cn(
    "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&>svg]:shrink-0",
    variant === "primary" && "bg-slate-950 text-white hover:bg-slate-800",
    variant === "secondary" &&
      "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
    variant === "accent" && "bg-cyan-700 text-white hover:bg-cyan-800",
    variant === "ghost" && "text-slate-700 hover:bg-slate-100",
    variant === "danger" && "bg-rose-600 text-white hover:bg-rose-700",
  );
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button className={cn(buttonStyles(variant), className)} {...props} />
  );
}
