"use client";

import { memo, useState, FormEvent, ChangeEvent } from "react";
import type { TaskPriority } from "@/lib/types";

/** Local calendar date as YYYY-MM-DD for `<input type="date" />`. */
function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface TaskFormProps {
  onSubmit?: (
    title: string,
    priority: TaskPriority,
    dueDate: string | null
  ) => void;
}

function TaskForm({ onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [dueDate, setDueDate] = useState(getTodayDateString);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  function validate(val: string) {
    if (!val.trim()) return "Title is required.";
    if (val.trim().length > 120) return "Title must be at most 120 characters.";
    return null;
  }

  function handleTitleChange(e: ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    setTouched(true);
    setError(validate(e.target.value));
  }

  function handleBlur() {
    setTouched(true);
    setError(validate(title));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = title.trim();
    const validationError = validate(trimmed);
    setTouched(true);
    setError(validationError);
    if (!validationError) {
      const due = dueDate.trim() || null;
      onSubmit?.(trimmed, priority, due);
      setTitle("");
      setPriority("Medium");
      setDueDate(getTodayDateString());
      setTouched(false);
      setError(null);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-3 sm:flex-row sm:items-center"
      noValidate
      aria-label="Add a new task"
    >
      <div className="flex w-full gap-3 items-start sm:items-center">
        <div className="flex-1 flex flex-col">
          <input
            id="task-form-title"
            type="text"
            value={title}
            onChange={handleTitleChange}
            onBlur={handleBlur}
            placeholder="What needs to be done?"
            className={`flex-1 rounded-lg border ${error && touched ? "border-red-400 focus-visible:border-red-500" : "border-zinc-300 focus-visible:border-zinc-500"} bg-white px-4 py-2.5 text-zinc-900 placeholder-zinc-500 outline-none transition focus-visible:ring-2 focus-visible:ring-zinc-200 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400 ${error && touched ? "dark:border-red-500 dark:focus-visible:border-red-500" : "dark:focus-visible:border-zinc-400"} dark:focus-visible:ring-zinc-700`}
            aria-label="Task title"
            aria-invalid={error && touched ? "true" : "false"}
            aria-describedby={
              error && touched ? "task-form-title-error" : undefined
            }
            maxLength={120} // not enforced for validation, just soft UI limit
          />
          <div className="min-h-[1.5rem] mt-1">
            {error && touched ? (
              <span
                id="task-form-title-error"
                className="text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {error}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 items-stretch sm:items-center flex-shrink-0">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            aria-label="Task priority"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus-visible:border-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-200 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:border-zinc-400 dark:focus-visible:ring-zinc-700 sm:w-auto sm:min-w-[8.5rem]"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Due date (optional)"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus-visible:border-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-200 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:[color-scheme:dark] dark:focus-visible:border-zinc-400 dark:focus-visible:ring-zinc-700 sm:w-auto"
          />
          <button
            type="submit"
            className="whitespace-nowrap rounded-lg bg-red-600 px-5 py-2.5 font-medium text-white transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus-visible:ring-red-400 dark:focus-visible:ring-offset-zinc-900"
            disabled={!!error && touched}
            aria-disabled={!!error && touched}
          >
            Add task
          </button>
        </div>
      </div>
    </form>
  );
}

export default memo(TaskForm);
