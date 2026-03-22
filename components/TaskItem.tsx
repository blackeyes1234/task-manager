"use client";

import { memo, useState, useEffect, FormEvent, useRef } from "react";
import type { Task, TaskPriority } from "@/lib/types";
import { DueDateLabel } from "@/components/DueDateLabel";

const priorityBadgeClass: Record<TaskPriority, string> = {
  High: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/20 dark:bg-red-950/50 dark:text-red-200 dark:ring-red-500/30",
  Medium:
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-950/50 dark:text-yellow-200 dark:ring-yellow-500/30",
  Low: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 ring-1 ring-inset ring-green-600/20 dark:bg-green-950/50 dark:text-green-200 dark:ring-green-500/30",
};

export const PriorityBadge = memo(function PriorityBadge({
  priority,
}: {
  priority: TaskPriority;
}) {
  return (
    <span className={priorityBadgeClass[priority]}>
      {priority}
    </span>
  );
});

interface TaskItemProps {
  task: Task;
  isNew?: boolean;
  onUpdate: (id: string, title: string) => void;
  // onDelete removed, since delete functionality is not needed
}

// Modal component with click-away to dismiss support
function ConfirmDeleteModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onCancel();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel]);
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-30"
      role="presentation"
    >
      <div
        ref={modalRef}
        className="z-50 min-w-[280px] rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-item-delete-dialog-title"
      >
        <div
          id="task-item-delete-dialog-title"
          className="mb-4 font-medium text-zinc-900 dark:text-zinc-100"
        >
          Delete this task?
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rounded px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-900"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskItem({
  task,
  isNew = false,
  onUpdate,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [isVisible, setIsVisible] = useState(!isNew);

  // Simulated state for "is deleting", modal presence
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  function handleOpenDelete() {
    setShowDeleteModal(true);
  }

  function handleDeleteCancel() {
    setShowDeleteModal(false);
    // Cancel delete (no other side effects needed, just close modal)
  }

  function handleDeleteConfirm() {
    setShowDeleteModal(false);
    // Here "onDelete" is removed in the app, so just close modal
    // If you need to pass to parent later, handle logic here
  }

  if (isEditing) {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50"
        aria-label="Edit task form"
      >
        <PriorityBadge priority={task.priority} />
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 outline-none focus-visible:border-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-zinc-600 dark:focus-visible:ring-offset-zinc-900"
          autoFocus
          aria-label="Edit task title"
        />
        <button
          type="submit"
          className="rounded px-2 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-900"
        >
          Save
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="rounded px-2 py-1.5 text-sm text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-900"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <>
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
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-zinc-900 dark:text-zinc-100">
          <div className="flex min-w-0 items-center gap-2">
            <PriorityBadge priority={task.priority} />
            <span className="min-w-0 flex-1">{task.title}</span>
          </div>
          <DueDateLabel task={task} />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded px-2 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-900"
            aria-label={`Edit task "${task.title}"`}
          >
            Edit
          </button>
          <button
            type="button"
            className="rounded px-2 py-1 text-sm font-medium text-red-500 hover:bg-red-100 hover:text-red-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:text-red-300 dark:hover:bg-red-800 dark:hover:text-red-100 dark:focus-visible:ring-offset-zinc-900"
            aria-label="Delete task"
            onClick={handleOpenDelete}
          >
            Delete
          </button>
        </div>
      </li>
      {showDeleteModal ? (
        <ConfirmDeleteModal
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
        />
      ) : null}
    </>
  );
}

export default memo(TaskItem);
