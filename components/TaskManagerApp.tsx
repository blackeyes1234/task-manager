"use client";

import {
  useState,
  useCallback,
  useMemo,
  useRef,
  startTransition,
} from "react";
import type { Task, TaskPriority } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { taskMatchesSearchQuery } from "@/lib/taskSearch";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  TASK_STORAGE_KEY,
  EMPTY_TASKS,
  deserializeTasksFromStorage,
} from "@/lib/taskStorage";
import TaskForm from "@/components/TaskForm";
import TaskSearchField from "@/components/TaskSearchField";
import ThemeToggle from "@/components/ThemeToggle";
import Toaster from "@/components/Toaster";
import { useToasts } from "@/hooks/useToasts";
import dynamic from "next/dynamic";

export type TaskFilter = "All" | "Active" | "Completed";

const TaskList = dynamic(() => import("@/components/TaskList"), {
  ssr: true,
  loading: () => (
    <p className="rounded-lg border border-dashed border-zinc-300 py-8 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
      Loading tasks…
    </p>
  ),
});

type PersistAction = "add" | "edit" | "delete";

export default function TaskManagerApp() {
  const lastPersistActionRef = useRef<PersistAction | null>(null);
  const { toasts, pushToast, dismissToast } = useToasts();

  const [tasks, setTasks] = useLocalStorage<Task[]>(TASK_STORAGE_KEY, EMPTY_TASKS, {
    deserialize: deserializeTasksFromStorage,
    onReadFallback: (reason) => {
      if (reason === "storage_error") {
        pushToast(
          "error",
          "Could not read saved tasks (storage unavailable). Starting with an empty list."
        );
      } else {
        pushToast(
          "error",
          "Saved tasks were invalid or corrupted. They were reset to keep the app working."
        );
      }
    },
    onWriteError: () => {
      const action = lastPersistActionRef.current;
      lastPersistActionRef.current = null;
      if (action === "add") {
        pushToast("error", "Failed to add task. Please try again.");
      } else if (action === "edit") {
        pushToast("error", "Failed to update task. Please try again.");
      } else if (action === "delete") {
        pushToast("error", "Failed to delete task. Please try again.");
      } else {
        pushToast("error", "Failed to save tasks. Please try again.");
      }
    },
  });
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("All");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  const onDebouncedSearchChange = useCallback((query: string) => {
    startTransition(() => setDebouncedSearch(query));
  }, []);

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

  const addTask = useCallback(
    (title: string, priority: TaskPriority, dueDate: string | null) => {
      lastPersistActionRef.current = "add";
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
      setTimeout(() => setRecentlyAddedId(null), 450);
      pushToast("success", "Task successfully added!");
    },
    [setTasks, pushToast]
  );

  const updateTask = useCallback(
    (id: string, title: string) => {
      lastPersistActionRef.current = "edit";
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, title: title.trim() } : task
        )
      );
      pushToast("success", "Task updated successfully!");
    },
    [setTasks, pushToast]
  );

  const toggleTaskComplete = useCallback(
    (id: string) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, completed: !task.completed } : task
        )
      );
    },
    [setTasks]
  );

  const deleteTask = useCallback(
    (id: string) => {
      lastPersistActionRef.current = "delete";
      setTasks((prev) => prev.filter((task) => task.id !== id));
      pushToast("success", "Task has been deleted.");
    },
    [setTasks, pushToast]
  );

  const filterOptions: TaskFilter[] = ["All", "Active", "Completed"];

  const onFilterClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const label = e.currentTarget.dataset.filter as TaskFilter | undefined;
      if (label) startTransition(() => setTaskFilter(label));
    },
    []
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <Toaster toasts={toasts} onDismiss={dismissToast} />
      <a
        href="#task-manager-content"
        className="fixed left-4 top-4 z-[200] -translate-y-[120vh] rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:focus:ring-red-400 dark:focus:ring-offset-zinc-950"
      >
        Skip to main content
      </a>
      <main
        id="task-manager-content"
        tabIndex={-1}
        className="w-full max-w-2xl space-y-8 px-4 py-12 sm:px-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-4 dark:focus-visible:ring-red-400/60 dark:focus-visible:ring-offset-zinc-950"
      >
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[60px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Task Manager
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Add, edit, and remove tasks below.
            </p>
          </div>
          <ThemeToggle />
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
                  data-filter={label}
                  aria-pressed={isSelected}
                  onClick={onFilterClick}
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

          <TaskSearchField onDebouncedChange={onDebouncedSearchChange} />

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
