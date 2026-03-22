import type { Task } from "@/lib/types";

function formatDueForSearch(due: string | null | undefined): string {
  if (due == null || due === "") return "";
  try {
    const d = new Date(`${due}T12:00:00`);
    if (Number.isNaN(d.getTime())) return due;
    const friendly = d.toLocaleDateString(undefined, { dateStyle: "medium" });
    return `${due} ${friendly}`;
  } catch {
    return due;
  }
}

/** Text blob used for case-insensitive substring search across task fields. */
export function getTaskSearchHaystack(task: Task): string {
  return [
    task.title,
    task.priority,
    formatDueForSearch(task.dueDate),
  ]
    .filter(Boolean)
    .join(" ");
}

export function taskMatchesSearchQuery(task: Task, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return getTaskSearchHaystack(task).toLowerCase().includes(q);
}
