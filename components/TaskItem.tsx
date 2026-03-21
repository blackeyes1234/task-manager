"use client";

import { useState, useEffect, FormEvent } from "react";
import type { Task } from "@/lib/types";

interface TaskItemProps {
  task: Task;
  isNew?: boolean;
  onUpdate: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskItem({
  task,
  isNew = false,
  onUpdate,
  onDelete,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [isVisible, setIsVisible] = useState(!isNew);

  useEffect(() => {
    if (isNew) {
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
      return () => cancelAnimationFrame(id);
    }
  }, [isNew]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== task.title) {
      onUpdate(task.id, trimmed);
    }
    setIsEditing(false);
    setEditTitle(task.title);
  }

  function handleCancel() {
    setIsEditing(false);
    setEditTitle(task.title);
  }

  if (isEditing) {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50"
      >
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          autoFocus
          aria-label="Edit task title"
        />
        <button
          type="submit"
          className="rounded px-2 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="rounded px-2 py-1.5 text-sm text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <li
      className="group flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
      style={
        isNew
          ? {
              opacity: isVisible ? 1 : 0,
              transition: "opacity 0.4s ease-out",
            }
          : undefined
      }
    >
      <span className="min-w-0 flex-1 text-zinc-900 dark:text-zinc-100">
        {task.title}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded px-2 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label="Edit task"
        >
          Edit
        </button>
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
}
