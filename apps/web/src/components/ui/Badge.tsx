import { cn } from "@/lib/utils";

const styles = {
  neutral: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
  success: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
  warning: "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200",
  danger: "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300",
  info: "bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-200",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof styles;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold",
        styles[tone],
      )}
    >
      {children}
    </span>
  );
}
