"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  type Task,
  type TaskPriority,
  parseDueDate,
  parseTaskPriority,
} from "@/lib/types";
import { generateId } from "@/lib/utils";
import { taskMatchesSearchQuery } from "@/lib/taskSearch";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";

const STORAGE_KEY = "task-manager-tasks";

export type TaskFilter = "All" | "Active" | "Completed";

function normalizeStoredTasks(raw: unknown[]): Task[] {
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

const SEARCH_DEBOUNCE_MS = 200;

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("All");
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebouncedValue(searchText, SEARCH_DEBOUNCE_MS);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const filteredTasks = useMemo(() => {
    switch (taskFilter) {
      case "Active":
        return tasks.filter((t) => !t.completed);
      case "Completed":
        return tasks.filter((t) => t.completed);
      default:
        return tasks;
    }
  }, [tasks, taskFilter]);

  const searchFilteredTasks = useMemo(() => {
    if (!debouncedSearch.trim()) return filteredTasks;
    return filteredTasks.filter((t) =>
      taskMatchesSearchQuery(t, debouncedSearch)
    );
  }, [filteredTasks, debouncedSearch]);

  const noResultsFromSearch =
    debouncedSearch.trim().length > 0 &&
    searchFilteredTasks.length === 0 &&
    filteredTasks.length > 0;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown[];
        if (Array.isArray(parsed)) setTasks(normalizeStoredTasks(parsed));
      }
    } catch {
      // ignore invalid stored data
    }
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, hasLoaded]);

  const addTask = useCallback(
    (title: string, priority: TaskPriority, dueDate: string | null) => {
      const id = generateId();
      setTasks((prev) => [
        ...prev,
        {
          id,
          title: title.trim(),
          completed: false,
          priority,
          dueDate: dueDate ?? null,
        },
      ]);
      setRecentlyAddedId(id);
      setTimeout(() => setRecentlyAddedId(null), 500);
    },
    []
  );

  const updateTask = useCallback((id: string, title: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, title: title.trim() } : task
      )
    );
  }, []);

  const toggleTaskComplete = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const filterOptions: TaskFilter[] = ["All", "Active", "Completed"];

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-2xl space-y-8 px-4 py-12 sm:px-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Task Manager
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Add, edit, and remove tasks below.
          </p>
        </header>

        <TaskForm onSubmit={addTask} />

        <section>
          <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Tasks
          </h2>
          <div
            className="mb-4 flex w-full gap-2"
            role="group"
            aria-label="Filter tasks"
          >
            {filterOptions.map((label) => {
              const isSelected = taskFilter === label;
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setTaskFilter(label)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 ${
                    isSelected
                      ? "bg-zinc-900 text-white shadow-sm focus:ring-zinc-500 dark:bg-zinc-100 dark:text-zinc-900 dark:focus:ring-zinc-400"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 focus:ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:focus:ring-zinc-600"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mb-4 flex w-full flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
            <div className="relative min-w-0 flex-1">
              <input
                type="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search tasks…"
                aria-label="Search tasks"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 pr-10 text-zinc-900 placeholder-zinc-500 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400 dark:focus:border-zinc-400 dark:focus:ring-zinc-700"
                autoComplete="off"
              />
              <span
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                aria-hidden
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSearchText("")}
              disabled={searchText.length === 0}
              className="shrink-0 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Clear
            </button>
          </div>

          <TaskList
            tasks={searchFilteredTasks}
            highlightQuery={debouncedSearch}
            noResultsFromSearch={noResultsFromSearch}
            recentlyAddedId={recentlyAddedId}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onToggleComplete={toggleTaskComplete}
          />
        </section>
      </main>
    </div>
  );
}
