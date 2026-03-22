export type TaskPriority = "High" | "Medium" | "Low";

export function parseTaskPriority(value: unknown): TaskPriority {
  if (value === "High" || value === "Medium" || value === "Low") {
    return value;
  }
  return "Medium";
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  /** ISO date YYYY-MM-DD; omit or null when not set */
  dueDate?: string | null;
}

export function parseDueDate(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  return t;
}
