import type { ValidationErrors } from "@/lib/types";

export function ErrorMessage({
  message,
  errors,
}: {
  message?: string | null;
  errors?: ValidationErrors;
}) {
  if (!message && !errors) {
    return null;
  }

  return (
    <div className="rounded-md border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
      {message ? <p className="font-medium">{message}</p> : null}
      {errors ? (
        <ul className="mt-2 list-inside list-disc space-y-1">
          {Object.entries(errors).map(([field, fieldErrors]) => (
            <li key={field}>{fieldErrors[0]}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
