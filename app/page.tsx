"use client";

import { useState, useCallback, useEffect } from "react";
import type { Task } from "@/lib/types";
import { generateId } from "@/lib/utils";
import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";

const STORAGE_KEY = "task-manager-tasks";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Task[];
        if (Array.isArray(parsed)) setTasks(parsed);
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

  const addTask = useCallback((title: string) => {
    const id = generateId();
    setTasks((prev) => [...prev, { id, title: title.trim() }]);
    setRecentlyAddedId(id);
    setTimeout(() => setRecentlyAddedId(null), 500);
  }, []);

  const updateTask = useCallback((id: string, title: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, title: title.trim() } : task
      )
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

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
          <TaskList
            tasks={tasks}
            recentlyAddedId={recentlyAddedId}
            onUpdate={updateTask}
            onDelete={deleteTask}
          />
        </section>
      </main>
    </div>
  );
}
