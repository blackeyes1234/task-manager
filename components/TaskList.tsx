"use client";

import type { Task } from "@/lib/types";
import { useState, useRef, useEffect } from "react";

interface TaskListProps {
  tasks: Task[];
  recentlyAddedId?: string | null;
  onDelete: (id: string) => void;
}

export default function TaskList({
  tasks: initialTasks,
  recentlyAddedId = null,
  onDelete,
}: TaskListProps) {
  const [taskOrder, setTaskOrder] = useState<string[]>(initialTasks.map(t => t.id));
  const [completedTasks, setCompletedTasks] = useState<{ [id: string]: boolean }>({});
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [localTitles, setLocalTitles] = useState<{ [id: string]: string }>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // For drag and drop
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<"above" | "below" | null>(null);

  useEffect(() => {
    setTaskOrder(currentOrder => {
      // Filter out deleted ids, add new ids
      const taskIds = initialTasks.map(t => t.id);
      let newOrder = currentOrder.filter(id => taskIds.includes(id));
      for (const id of taskIds) {
        if (!newOrder.includes(id)) {
          newOrder.push(id);
        }
      }
      return newOrder;
    });
    setLocalTitles(
      initialTasks.reduce((acc, task) => {
        acc[task.id] = task.title;
        return acc;
      }, {} as { [id: string]: string })
    );
  }, [initialTasks]);

  useEffect(() => {
    if (editingTaskId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTaskId]);

  const handleToggleComplete = (taskId: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleEditClick = (taskId: string) => {
    setEditingTaskId(taskId);
    setEditTitle(localTitles[taskId] ?? "");
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditTitle(e.target.value);
  };

  const handleSave = (taskId: string) => {
    const trimmed = editTitle.trim();
    if (!trimmed) return; // Do nothing if input is empty

    setLocalTitles((prev) => ({
      ...prev,
      [taskId]: trimmed,
    }));
    setEditingTaskId(null);
  };

  const handleCancel = () => {
    setEditingTaskId(null);
    setEditTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, taskId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave(taskId);
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleInputBlur = (taskId: string) => {
    handleCancel();
  };

  // Drag and Drop Handlers
  const onDragStart = (id: string) => {
    setDraggedId(id);
  };

  // Determine "above" or "below" drop based on cursor position
  const onDragOver = (e: React.DragEvent<HTMLLIElement>, overId: string) => {
    e.preventDefault();
    if (!e.currentTarget) return;
    const bounding = e.currentTarget.getBoundingClientRect();
    const offset = e.clientY - bounding.top;
    // if in the upper half of list item, consider "above", else "below"
    const position: "above" | "below" =
      offset < bounding.height / 2 ? "above" : "below";
    setDragOverId(overId);
    setDragOverPosition(position);
  };

  const onDrop = (e: React.DragEvent<HTMLLIElement>, droppedId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === droppedId) {
      setDraggedId(null);
      setDragOverId(null);
      setDragOverPosition(null);
      return;
    }
    setTaskOrder(prevOrder => {
      const updated = [...prevOrder];
      const fromIdx = updated.indexOf(draggedId);
      let toIdx = updated.indexOf(droppedId);

      // Remove the dragged task
      updated.splice(fromIdx, 1);

      // Insert above or below droppedId depending on dragOverPosition
      let insertIdx = toIdx;
      if (dragOverPosition === "below") {
        // If moving downward and after removing an item before, index is decreased
        if (fromIdx < toIdx) {
          insertIdx = toIdx;
        } else {
          insertIdx = toIdx + 1;
        }
      } else {
        // "above": always insert before the target task
        if (fromIdx < toIdx) {
          insertIdx = toIdx - 1;
        } else {
          insertIdx = toIdx;
        }
      }

      // Clamp insertIdx
      insertIdx = Math.max(0, Math.min(insertIdx, updated.length));

      updated.splice(insertIdx, 0, draggedId);
      return updated;
    });
    setDraggedId(null);
    setDragOverId(null);
    setDragOverPosition(null);
  };

  const onDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    setDragOverPosition(null);
  };

  if (initialTasks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 py-8 text-center text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
        No tasks yet. Add one above.
      </p>
    );
  }

  // Find the task object for an id
  const findTask = (id: string) => initialTasks.find(t => t.id === id);

  return (
    <>
      <style>
        {`
          .task-hover:hover {
            background-color: #e0f2fe !important; /* Tailwind sky-100 */
            transition: background 0.15s ease;
          }
          .dark .task-hover:hover {
            background-color: #1e3a8a !important;
          }
          .drag-over-above {
            outline: 2px dashed #2563eb !important; /* blue-600 */
            background: linear-gradient(to bottom, #dbeafe 80%, transparent 100%) !important; /* blue-100 fade */
          }
          .drag-over-below {
            outline: 2px dashed #2563eb !important;
            background: linear-gradient(to top, #dbeafe 80%, transparent 100%) !important;
          }
          .dragged {
            opacity: 0.6;
            background: #ddd !important;
          }
        `}
      </style>
      <ul className="flex flex-col gap-2">
        {taskOrder.map((taskId, idx) => {
          const task = findTask(taskId);
          if (!task) return null;
          const isCompleted = !!completedTasks[task.id];
          const isEditing = editingTaskId === task.id;
          const displayTitle = localTitles[task.id] ?? task.title;
          const dragging = draggedId === task.id;
          const isDragOver = dragOverId === task.id && draggedId !== task.id;
          const dragOverClass =
            isDragOver && dragOverPosition === "above"
              ? "drag-over-above"
              : isDragOver && dragOverPosition === "below"
              ? "drag-over-below"
              : "";

          return (
            <li
              key={task.id}
              className={[
                "group flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 task-hover",
                dragging && "dragged",
                dragOverClass,
              ]
                .filter(Boolean)
                .join(" ")}
              draggable={!isEditing}
              onDragStart={e => !isEditing && onDragStart(task.id)}
              onDragOver={e => !isEditing && onDragOver(e, task.id)}
              onDrop={e => !isEditing && onDrop(e, task.id)}
              onDragEnd={onDragEnd}
              tabIndex={-1}
              style={{ cursor: isEditing ? "default" : "grab", userSelect: "none" }}
            >
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={() => handleToggleComplete(task.id)}
                  className="form-checkbox h-5 w-5 text-red-600 rounded border-zinc-300 focus:ring-red-500 dark:border-zinc-600 dark:bg-zinc-900"
                  aria-label={isCompleted ? "Mark as active" : "Mark as completed"}
                  tabIndex={isEditing ? -1 : 0}
                />
                {isEditing ? (
                  <form
                    className="flex flex-1 gap-2"
                    onSubmit={e => {
                      e.preventDefault();
                      handleSave(task.id);
                    }}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={editTitle}
                      onChange={handleEditChange}
                      onKeyDown={e => handleKeyDown(e, task.id)}
                      onBlur={() => handleInputBlur(task.id)}
                      className="min-w-0 flex-1 rounded-lg border border-red-400 bg-zinc-50 px-2 py-1.5 text-sm outline-none focus:border-red-500 focus:bg-white dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                      aria-label="Edit task title"
                    />
                    <button
                      type="submit"
                      className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      tabIndex={0}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="rounded bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                      tabIndex={0}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <span
                    tabIndex={0}
                    role="button"
                    onClick={() => handleEditClick(task.id)}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleEditClick(task.id);
                      }
                    }}
                    className={`min-w-0 flex-1 cursor-pointer text-zinc-900 dark:text-zinc-100 transition-all outline-none ring-offset-1 ring-zinc-400 focus:ring-2 ${
                      isCompleted ? "line-through text-zinc-400 dark:text-zinc-500" : ""
                    }`}
                    aria-label={`Edit task "${displayTitle}"`}
                  >
                    {displayTitle}
                  </span>
                )}
                {!isEditing && (
                  <span
                    title="Drag to reorder"
                    className="pl-2 text-xl cursor-grab select-none text-zinc-400 dark:text-zinc-600"
                    style={{ userSelect: "none" }}
                    aria-label="Drag to reorder"
                  >
                    ≡
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onDelete(task.id)}
                  className="rounded px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  aria-label="Delete task"
                  tabIndex={isEditing ? -1 : 0}
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
