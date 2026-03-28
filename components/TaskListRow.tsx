"use client";

import type { Task } from "@/lib/types";
import { DueDateLabel } from "@/components/DueDateLabel";
import HighlightedText from "@/components/HighlightedText";
import { PriorityBadge } from "@/components/TaskItem";
import { memo, useCallback, type RefObject } from "react";

export type TaskListRowProps = {
  task: Task;
  displayTitle: string;
  highlightQuery: string;
  isEditing: boolean;
  editTitle: string;
  inputRef: RefObject<HTMLInputElement | null>;
  isCompleted: boolean;
  dragging: boolean;
  dragOverClass:
    | ""
    | "task-list-drag-over-above"
    | "task-list-drag-over-below";
  isLeaving: boolean;
  isEntering: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  /** When true, drag and move buttons are disabled (e.g. while search is active). */
  reorderLocked?: boolean;
  onToggleComplete: (id: string) => void;
  onEditTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditInputKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
    id: string
  ) => void;
  onEditSave: (id: string) => void;
  onEditCancel: () => void;
  onEditActivate: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, direction: "up" | "down") => void;
  onDragStartRow: (id: string) => void;
  onDragOverRow: (e: React.DragEvent<HTMLLIElement>, id: string) => void;
  onDropRow: (e: React.DragEvent<HTMLLIElement>, id: string) => void;
  onDragEnd: () => void;
};

function TaskListRow({
  task,
  displayTitle,
  highlightQuery,
  isEditing,
  editTitle,
  inputRef,
  isCompleted,
  dragging,
  dragOverClass,
  isLeaving,
  isEntering,
  canMoveUp,
  canMoveDown,
  reorderLocked = false,
  onToggleComplete,
  onEditTitleChange,
  onEditInputKeyDown,
  onEditSave,
  onEditCancel,
  onEditActivate,
  onDelete,
  onReorder,
  onDragStartRow,
  onDragOverRow,
  onDropRow,
  onDragEnd,
}: TaskListRowProps) {
  const id = task.id;

  const toggleComplete = useCallback(() => {
    onToggleComplete(id);
  }, [onToggleComplete, id]);

  const deleteTask = useCallback(() => {
    onDelete(id);
  }, [onDelete, id]);

  const moveUp = useCallback(() => {
    onReorder(id, "up");
  }, [onReorder, id]);

  const moveDown = useCallback(() => {
    onReorder(id, "down");
  }, [onReorder, id]);

  const activateEdit = useCallback(() => {
    onEditActivate(id);
  }, [onEditActivate, id]);

  const titleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLSpanElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onEditActivate(id);
      }
    },
    [onEditActivate, id]
  );

  const saveEdit = useCallback(() => {
    onEditSave(id);
  }, [onEditSave, id]);

  const keyDownEdit = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      onEditInputKeyDown(e, id);
    },
    [onEditInputKeyDown, id]
  );

  const dragStart = useCallback(() => {
    if (!isEditing && !reorderLocked) onDragStartRow(id);
  }, [isEditing, reorderLocked, onDragStartRow, id]);

  const dragOver = useCallback(
    (e: React.DragEvent<HTMLLIElement>) => {
      if (!isEditing && !reorderLocked) onDragOverRow(e, id);
    },
    [isEditing, reorderLocked, onDragOverRow, id]
  );

  const drop = useCallback(
    (e: React.DragEvent<HTMLLIElement>) => {
      if (!isEditing && !reorderLocked) onDropRow(e, id);
    },
    [isEditing, reorderLocked, onDropRow, id]
  );

  return (
    <li
      className={[
        "group flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 task-list-row-hover",
        dragging && "task-list-dragged",
        dragOverClass,
        isEntering && "task-list-item-enter",
        isLeaving && "task-list-item-leaving",
      ]
        .filter(Boolean)
        .join(" ")}
      draggable={!reorderLocked && !isEditing && !isLeaving}
      onDragStart={dragStart}
      onDragOver={dragOver}
      onDrop={drop}
      onDragEnd={onDragEnd}
      tabIndex={-1}
      style={{
        cursor:
          isEditing || reorderLocked ? "default" : "grab",
        userSelect: "none",
      }}
    >
      <div className="flex flex-1 items-start gap-2">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={toggleComplete}
          className="form-checkbox mt-1 h-5 w-5 shrink-0 rounded border-zinc-300 text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-900 dark:focus-visible:ring-offset-zinc-900"
          aria-label={
            isCompleted
              ? `Mark task "${displayTitle}" as active`
              : `Mark task "${displayTitle}" as completed`
          }
          tabIndex={isEditing ? -1 : 0}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <PriorityBadge priority={task.priority} />
            {isEditing ? (
              <form
                className="flex min-w-0 flex-1 gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveEdit();
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={editTitle}
                  onChange={onEditTitleChange}
                  onKeyDown={keyDownEdit}
                  onBlur={onEditCancel}
                  className="min-w-0 flex-1 rounded-lg border border-red-400 bg-zinc-50 px-2 py-1.5 text-sm text-zinc-900 outline-none focus-visible:border-red-500 focus-visible:bg-white focus-visible:text-zinc-900 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus-visible:border-red-500 dark:focus-visible:bg-zinc-950 dark:focus-visible:text-zinc-50 dark:focus-visible:ring-offset-zinc-900"
                  aria-label="Edit task title"
                />
                <button
                  type="submit"
                  className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
                  tabIndex={0}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={onEditCancel}
                  className="rounded bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-900"
                  tabIndex={0}
                >
                  Cancel
                </button>
              </form>
            ) : (
              <span
                tabIndex={0}
                role="button"
                onClick={activateEdit}
                onKeyDown={titleKeyDown}
                className={`min-w-0 flex-1 cursor-pointer rounded-sm text-left text-zinc-900 outline-none ring-offset-2 transition-all focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:text-zinc-100 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-900 ${
                  isCompleted
                    ? "line-through text-zinc-400 dark:text-zinc-500"
                    : ""
                }`}
                aria-label={`Edit task "${displayTitle}"`}
              >
                <HighlightedText text={displayTitle} query={highlightQuery} />
              </span>
            )}
            {!isEditing && (
              <span
                title={
                  reorderLocked
                    ? "Clear search to reorder tasks."
                    : "Drag to reorder with the mouse. Use the Move up / Move down buttons for keyboard reordering."
                }
                className={`shrink-0 select-none pl-2 text-xl text-zinc-400 dark:text-zinc-600 ${reorderLocked ? "cursor-default opacity-40" : "cursor-grab"}`}
                style={{ userSelect: "none" }}
                aria-hidden
              >
                ≡
              </span>
            )}
          </div>
          {!isEditing && <DueDateLabel task={task} />}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {!isEditing && !isLeaving && (
          <div
            className="flex flex-col gap-0.5"
            role="group"
            aria-label={`Reorder task: ${displayTitle}`}
          >
            <button
              type="button"
              onClick={moveUp}
              disabled={!canMoveUp || reorderLocked}
              aria-label={`Move "${displayTitle}" up in the list`}
              className="flex h-7 w-8 items-center justify-center rounded border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-900"
            >
              <span aria-hidden>↑</span>
            </button>
            <button
              type="button"
              onClick={moveDown}
              disabled={!canMoveDown || reorderLocked}
              aria-label={`Move "${displayTitle}" down in the list`}
              className="flex h-7 w-8 items-center justify-center rounded border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-900"
            >
              <span aria-hidden>↓</span>
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={deleteTask}
          className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus-visible:ring-offset-zinc-900"
          aria-label={`Delete task "${displayTitle}"`}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export default memo(TaskListRow);
