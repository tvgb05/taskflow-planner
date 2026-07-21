export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
      <h3 className="text-base font-semibold text-slate-950 dark:text-slate-50">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
