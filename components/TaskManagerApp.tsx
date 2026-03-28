"use client";

import {
  useState,
  useCallback,
  useMemo,
  startTransition,
  useEffect,
  useRef,
} from "react";
import type { User } from "@supabase/supabase-js";
import type { Task, TaskPriority } from "@/lib/types";
import { taskMatchesSearchQuery } from "@/lib/taskSearch";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import {
  createTask,
  deleteTaskById,
  listTasks,
  reorderTasks,
  updateTaskCompleted,
  updateTaskTitle,
} from "@/lib/taskApi";
import { mergeVisibleOrderIntoFull } from "@/lib/mergeTaskOrder";
import TaskForm from "@/components/TaskForm";
import TaskSearchField from "@/components/TaskSearchField";
import ThemeToggle from "@/components/ThemeToggle";
import Toaster from "@/components/Toaster";
import { useToasts } from "@/hooks/useToasts";
import dynamic from "next/dynamic";
import GoogleSignInPanel from "@/components/GoogleSignInPanel";
import AuthAccountMenu from "@/components/AuthAccountMenu";

export type TaskFilter = "All" | "Active" | "Completed";

const TaskList = dynamic(() => import("@/components/TaskList"), {
  ssr: true,
  loading: () => (
    <p className="rounded-lg border border-dashed border-zinc-300 py-8 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
      Loading tasks…
    </p>
  ),
});

export default function TaskManagerApp() {
  const { toasts, pushToast, dismissToast } = useToasts();
  const pushToastRef = useRef(pushToast);

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("All");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  useEffect(() => {
    pushToastRef.current = pushToast;
  }, [pushToast]);

  useEffect(() => {
    let cancelled = false;

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) {
        setUser(session?.user ?? null);
        setAuthReady(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!authReady || !user) {
      setTasks([]);
      setIsLoadingTasks(false);
      return;
    }

    let cancelled = false;
    setIsLoadingTasks(true);

    async function loadTasks() {
      try {
        const loaded = await listTasks(supabase);
        if (!cancelled) setTasks(loaded);
      } catch {
        if (!cancelled) {
          pushToastRef.current(
            "error",
            "Could not load tasks from Supabase. Check your connection and environment variables."
          );
          setTasks([]);
        }
      } finally {
        if (!cancelled) setIsLoadingTasks(false);
      }
    }

    void loadTasks();
    return () => {
      cancelled = true;
    };
  }, [authReady, user, supabase]);

  useEffect(() => {
    if (!authReady || !user) return;

    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const refreshFromServer = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = undefined;
        void listTasks(supabase)
          .then((loaded) => {
            if (!cancelled) setTasks(loaded);
          })
          .catch(() => {});
      }, 120);
    };

    const channel = supabase
      .channel(`tasks-sync:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `user_id=eq.${user.id}`,
        },
        refreshFromServer
      )
      .subscribe();

    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshFromServer();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      void supabase.removeChannel(channel);
    };
  }, [authReady, user, supabase]);

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
    async (title: string, priority: TaskPriority, dueDate: string | null) => {
      try {
        const created = await createTask(supabase, {
          title: title.trim(),
          priority,
          dueDate: dueDate ?? null,
        });
        setTasks((prev) => [...prev, created]);
        setRecentlyAddedId(created.id);
        setTimeout(() => setRecentlyAddedId(null), 450);
        pushToast("success", "Task successfully added!");
      } catch {
        pushToast("error", "Failed to add task. Please try again.");
      }
    },
    [supabase, pushToast]
  );

  const updateTask = useCallback(
    async (id: string, title: string) => {
      const trimmed = title.trim();
      const previous = tasks.find((task) => task.id === id);
      if (!previous) return;

      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, title: trimmed } : task
        )
      );

      try {
        const updated = await updateTaskTitle(supabase, id, trimmed);
        setTasks((prev) =>
          prev.map((task) => (task.id === id ? updated : task))
        );
        pushToast("success", "Task updated successfully!");
      } catch {
        setTasks((prev) =>
          prev.map((task) => (task.id === id ? previous : task))
        );
        pushToast("error", "Failed to update task. Please try again.");
      }
    },
    [tasks, supabase, pushToast]
  );

  const toggleTaskComplete = useCallback(
    async (id: string) => {
      const previous = tasks.find((task) => task.id === id);
      if (!previous) return;

      const nextCompleted = !previous.completed;

      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, completed: nextCompleted } : task
        )
      );

      try {
        const updated = await updateTaskCompleted(supabase, id, nextCompleted);
        setTasks((prev) =>
          prev.map((task) => (task.id === id ? updated : task))
        );
      } catch {
        setTasks((prev) =>
          prev.map((task) => (task.id === id ? previous : task))
        );
        pushToast("error", "Failed to update task. Please try again.");
      }
    },
    [tasks, supabase, pushToast]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const previous = tasks;
      setTasks((prev) => prev.filter((task) => task.id !== id));

      try {
        await deleteTaskById(supabase, id);
        pushToast("success", "Task has been deleted.");
      } catch {
        setTasks(previous);
        pushToast("error", "Failed to delete task. Please try again.");
      }
    },
    [tasks, supabase, pushToast]
  );

  const persistTaskOrder = useCallback(
    async (newVisibleOrder: string[]) => {
      if (debouncedSearch.trim()) return;

      const fullIds = tasks.map((t) => t.id);
      const visibleIds = searchFilteredTasks.map((t) => t.id);
      const merged = mergeVisibleOrderIntoFull(
        fullIds,
        visibleIds,
        newVisibleOrder
      );

      if (
        merged.length !== fullIds.length ||
        new Set(merged).size !== merged.length
      ) {
        return;
      }

      const byId = new Map(tasks.map((t) => [t.id, t]));
      const reordered = merged
        .map((id) => byId.get(id))
        .filter((t): t is Task => t != null);

      if (reordered.length !== merged.length) return;

      const previous = tasks;
      setTasks(reordered);

      try {
        await reorderTasks(supabase, merged);
      } catch {
        setTasks(previous);
        pushToast("error", "Failed to save task order. Please try again.");
      }
    },
    [tasks, searchFilteredTasks, debouncedSearch, supabase, pushToast]
  );

  const filterOptions: TaskFilter[] = ["All", "Active", "Completed"];

  const onFilterClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const label = e.currentTarget.dataset.filter as TaskFilter | undefined;
      if (label) startTransition(() => setTaskFilter(label));
    },
    []
  );

  const onGoogleOAuthError = useCallback(() => {
    pushToast(
      "error",
      "Could not start Google sign-in. Check Supabase Google provider settings."
    );
  }, [pushToast]);

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
            <h1
              className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 text-4xl sm:text-5xl md:text-6xl"
            >
              Task Manager
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Add, edit, and remove tasks below.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            {user ? (
              <AuthAccountMenu supabase={supabase} user={user} />
            ) : null}
            <ThemeToggle />
          </div>
        </header>

        {!authReady ? (
          <p className="rounded-lg border border-dashed border-zinc-300 py-8 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
            Checking sign-in…
          </p>
        ) : !user ? (
          <GoogleSignInPanel
            supabase={supabase}
            onError={onGoogleOAuthError}
          />
        ) : (
          <>
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

              {isLoadingTasks ? (
                <p className="rounded-lg border border-dashed border-zinc-300 py-8 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
                  Loading tasks from Supabase…
                </p>
              ) : (
                <TaskList
                  tasks={searchFilteredTasks}
                  highlightQuery={debouncedSearch}
                  noResultsFromSearch={noResultsFromSearch}
                  recentlyAddedId={recentlyAddedId}
                  onUpdate={updateTask}
                  onDelete={deleteTask}
                  onToggleComplete={toggleTaskComplete}
                  onPersistOrder={persistTaskOrder}
                />
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
