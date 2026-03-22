// Utility functions for the task manager app

export function generateId(): string {
  try {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }
  } catch {
    // non-secure contexts or restricted environments
  }
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
