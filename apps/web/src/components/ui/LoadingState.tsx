export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid min-h-40 place-items-center rounded-md border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-sm font-medium text-slate-500 dark:text-slate-400">
      {label}
    </div>
  );
}
