import * as amplitude from "@amplitude/analytics-browser";

let initialized = false;

function enabled(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    Boolean(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY?.trim())
  );
}

function ensureInit(): boolean {
  if (typeof window === "undefined") return false;
  if (!enabled()) return false;
  if (initialized) return true;
  const key = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY!.trim();
  amplitude.init(key, { defaultTracking: false });
  initialized = true;
  return true;
}

export function setAmplitudeUserId(userId: string | null | undefined): void {
  if (!ensureInit()) return;
  amplitude.setUserId(userId ?? undefined);
}

export function resetAmplitudeUser(): void {
  if (!enabled() || !initialized) return;
  amplitude.reset();
}

export function trackTasksListed(taskCount: number): void {
  if (!ensureInit()) return;
  amplitude.track("Tasks Listed", { task_count: taskCount });
}

export function trackTaskCreated(properties: {
  priority: string;
  has_due_date: boolean;
}): void {
  if (!ensureInit()) return;
  amplitude.track("Task Created", properties);
}

export function trackTaskTitleUpdated(): void {
  if (!ensureInit()) return;
  amplitude.track("Task Title Updated");
}

export function trackTaskCompletionUpdated(completed: boolean): void {
  if (!ensureInit()) return;
  amplitude.track("Task Completion Updated", { completed });
}

export function trackTaskDeleted(): void {
  if (!ensureInit()) return;
  amplitude.track("Task Deleted");
}

export function trackTaskOrderUpdated(taskCount: number): void {
  if (!ensureInit()) return;
  amplitude.track("Task Order Updated", { task_count: taskCount });
}
