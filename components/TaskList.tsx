"use client";

import type { Task } from "@/lib/types";
import { DueDateLabel } from "@/components/DueDateLabel";
import HighlightedText from "@/components/HighlightedText";
import { PriorityBadge } from "@/components/TaskItem";
import { useState, useRef, useEffect } from "react";

interface TaskListProps {
  tasks: Task[];
  /** Debounced search string; used to highlight matches in titles. */
  highlightQuery?: string;
  /** True when status filter has tasks but search returned none. */
  noResultsFromSearch?: boolean;
  recentlyAddedId?: string | null;
  onUpdate: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

export default function TaskList({
  tasks: initialTasks,
  highlightQuery = "",
  noResultsFromSearch = false,
  recentlyAddedId = null,
  onUpdate,
  onDelete,
  onToggleComplete,
}: TaskListProps) {
  const [taskOrder, setTaskOrder] = useState<string[]>(initialTasks.map(t => t.id));
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [localTitles, setLocalTitles] = useState<{ [id: string]: string }>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // For drag and drop
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<"above" | "below" | null>(null);

  // For delete confirmation
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);

  // Ref for the modal dialog element
  const deleteModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTaskOrder(currentOrder => {
      // Filter out ids not in the latest tasks, add new ids
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

  // Close the delete modal when click away from the modal popup
  useEffect(() => {
    if (!showDeleteDialog) return;

    function handleClickAway(event: MouseEvent) {
      // if click is outside the modal dialog content, trigger cancel
      if (
        deleteModalRef.current &&
        !deleteModalRef.current.contains(event.target as Node)
      ) {
        cancelDelete();
      }
    }

    // Use mousedown to ensure it fires before focus events
    document.addEventListener("mousedown", handleClickAway);
    return () => {
      document.removeEventListener("mousedown", handleClickAway);
    };
  }, [showDeleteDialog]);

  const handleToggleComplete = (taskId: string) => {
    onToggleComplete(taskId);
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
    onUpdate(taskId, trimmed);
    setEditingTaskId(null);
  };

  const handleCancel = () => {
    setEditingTaskId(null);
    setEditTitle("");
  };

  // Replacement for window.confirm dialog
  const handleDelete = (taskId: string) => {
    setPendingDeleteId(taskId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (pendingDeleteId) {
      onDelete(pendingDeleteId);
    }
    setPendingDeleteId(null);
    setShowDeleteDialog(false);
  };

  const cancelDelete = () => {
    setPendingDeleteId(null);
    setShowDeleteDialog(false);
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
    if (noResultsFromSearch) {
      return (
        <div
          className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/80 px-4 py-8 text-center dark:border-zinc-600 dark:bg-zinc-900/40"
          role="status"
        >
          <p className="font-medium text-zinc-800 dark:text-zinc-200">
            No tasks match your search.
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Try different keywords, clear the search, or switch your{" "}
            <span className="font-medium">All / Active / Completed</span> filter.
          </p>
        </div>
      );
    }
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
          .modal-bg {
            background: rgba(0,0,0,0.2);
            position: fixed;
            z-index: 50;
            left:0;top:0;right:0;bottom:0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        `}
      </style>
      <ul className="flex flex-col gap-2">
        {taskOrder.map((taskId, idx) => {
          const task = findTask(taskId);
          if (!task) return null;
          const isCompleted = task.completed;
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
              <div className="flex items-start gap-2 flex-1">
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={() => handleToggleComplete(task.id)}
                  className="form-checkbox mt-1 h-5 w-5 shrink-0 text-red-600 rounded border-zinc-300 focus:ring-red-500 dark:border-zinc-600 dark:bg-zinc-900"
                  aria-label={isCompleted ? "Mark as active" : "Mark as completed"}
                  tabIndex={isEditing ? -1 : 0}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <PriorityBadge priority={task.priority} />
                    {isEditing ? (
                      <form
                        className="flex min-w-0 flex-1 gap-2"
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
                        <HighlightedText
                          text={displayTitle}
                          query={highlightQuery}
                        />
                      </span>
                    )}
                    {!isEditing && (
                      <span
                        title="Drag to reorder"
                        className="shrink-0 pl-2 text-xl cursor-grab select-none text-zinc-400 dark:text-zinc-600"
                        style={{ userSelect: "none" }}
                        aria-label="Drag to reorder"
                      >
                        ≡
                      </span>
                    )}
                  </div>
                  {!isEditing && <DueDateLabel task={task} />}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(task.id)}
                className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700"
                aria-label="Delete task"
              >
                Delete
              </button>
            </li>
          );
        })}
      </ul>
      {/* Simple Modal for Delete Confirmation */}
      {showDeleteDialog && (
        <div className="modal-bg">
          <div
            ref={deleteModalRef}
            className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-md p-6 z-50 flex flex-col gap-4 min-w-[280px]"
            tabIndex={-1}
          >
            <div className="text-zinc-900 dark:text-zinc-100 font-medium">
              Are you sure you want to delete this task?
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelDelete}
                className="rounded bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700"
                autoFocus
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
