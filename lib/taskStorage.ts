import { type Task, parseDueDate, parseTaskPriority } from "@/lib/types";

export const TASK_STORAGE_KEY = "task-manager-tasks";

export const EMPTY_TASKS: Task[] = [];

export function normalizeStoredTasks(raw: unknown[]): Task[] {
  return raw
    .filter(
      (t): t is {
        id?: unknown;
        title?: unknown;
        completed?: unknown;
        priority?: unknown;
        dueDate?: unknown;
      } => t !== null && typeof t === "object"
    )
    .map((t) => ({
      id: String(t.id ?? ""),
      title: typeof t.title === "string" ? t.title : "",
      completed: Boolean(t.completed),
      priority: parseTaskPriority(t.priority),
      dueDate: parseDueDate(t.dueDate),
    }))
    .filter((t) => t.id.length > 0);
}

export function deserializeTasksFromStorage(raw: string): Task[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return normalizeStoredTasks(parsed);
  } catch {
    return null;
  }
}
