export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(
  value?: string | null,
  format: DateFormat = "dd/mm/yyyy",
) {
  if (!value) {
    return "--";
  }

  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;

  if (format === "mm/dd/yyyy") return `${month}/${day}/${year}`;
  if (format === "yyyy-mm-dd") return `${year}-${month}-${day}`;

  return `${day}/${month}/${year}`;
}

export function isDueSoon(value?: string | null) {
  if (!value) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(`${value}T00:00:00`);
  const days = (deadline.getTime() - today.getTime()) / 86400000;

  return days >= 0 && days <= 7;
}

export function todayDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
import type { DateFormat } from "@/lib/preferences";
