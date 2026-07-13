export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid min-h-40 place-items-center rounded-md border border-dashed border-slate-200 bg-white p-8 text-sm font-medium text-slate-500">
      {label}
    </div>
  );
}
