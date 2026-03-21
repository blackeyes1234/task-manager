"use client";

import type { Task } from "@/lib/types";

interface TaskListProps {
  tasks: Task[];
  recentlyAddedId?: string | null;
  onDelete: (id: string) => void;
}

import { useState } from "react";

export default function TaskList({
  tasks,
  recentlyAddedId = null,
  onDelete,
}: TaskListProps) {
  // Track which tasks are completed in local state (for demo purposes)
  const [completedTasks, setCompletedTasks] = useState<{ [id: string]: boolean }>({});

  const handleToggleComplete = (taskId: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  if (tasks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 py-8 text-center text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
        No tasks yet. Add one above.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((task) => {
        const isCompleted = !!completedTasks[task.id];
        return (
          <li
            key={task.id}
            className="group flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-2 flex-1">
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={() => handleToggleComplete(task.id)}
                className="form-checkbox h-5 w-5 text-red-600 rounded border-zinc-300 focus:ring-red-500 dark:border-zinc-600 dark:bg-zinc-900"
                aria-label={isCompleted ? "Mark as active" : "Mark as completed"}
              />
              <span
                className={`min-w-0 flex-1 text-zinc-900 dark:text-zinc-100 transition-all ${
                  isCompleted ? "line-through text-zinc-400 dark:text-zinc-500" : ""
                }`}
              >
                {task.title}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="rounded px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                aria-label="Delete task"
              >
                Delete
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
