/**
 * Relative label for a calendar due date (YYYY-MM-DD).
 * Returns null when empty or invalid.
 */
export function formatDueDateLabel(
  dueDate: string | null | undefined
): string | null {
  if (dueDate == null || String(dueDate).trim() === "") return null;

  const parsed = parseISODateLocal(dueDate);
  if (!parsed) return null;

  const today = startOfLocalDay(new Date());
  const diffDays = calendarDaysBetween(parsed, today);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 1) return `In ${diffDays} days`;
  if (diffDays === -1) return "Yesterday";
  return `${-diffDays} days ago`;
}

export function isDueDateOverdue(
  dueDate: string | null | undefined,
  completed: boolean
): boolean {
  if (completed) return false;
  const parsed = parseISODateLocal(dueDate ?? "");
  if (!parsed) return false;
  const today = startOfLocalDay(new Date());
  return parsed.getTime() < today.getTime();
}

function parseISODateLocal(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const month = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(month) || !Number.isFinite(d))
    return null;
  const date = new Date(y, month - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function calendarDaysBetween(due: Date, today: Date): number {
  const dueStart = startOfLocalDay(due).getTime();
  const todayStart = startOfLocalDay(today).getTime();
  return Math.round((dueStart - todayStart) / 86400000);
}
