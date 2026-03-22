"use client";

import type { Task } from "@/lib/types";
import { reorderTaskIdsAfterDrop } from "@/lib/reorderTaskIds";
import DeleteTaskDialog from "@/components/DeleteTaskDialog";
import TaskListEmpty from "@/components/TaskListEmpty";
import TaskListRow from "@/components/TaskListRow";
import {
  memo,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";

interface TaskListProps {
  tasks: Task[];
  highlightQuery?: string;
  noResultsFromSearch?: boolean;
  recentlyAddedId?: string | null;
  onUpdate: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

function TaskList({
  tasks: initialTasks,
  highlightQuery = "",
  noResultsFromSearch = false,
  recentlyAddedId = null,
  onUpdate,
  onDelete,
  onToggleComplete,
}: TaskListProps) {
  const [taskOrder, setTaskOrder] = useState<string[]>(() =>
    initialTasks.map((t) => t.id)
  );
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [localTitles, setLocalTitles] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const editTitleRef = useRef("");

  useEffect(() => {
    editTitleRef.current = editTitle;
  }, [editTitle]);

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<
    "above" | "below" | null
  >(null);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [exitingTaskIds, setExitingTaskIds] = useState<Set<string>>(
    () => new Set()
  );

  const deleteTriggerRef = useRef<HTMLElement | null>(null);
  const pendingDeleteFocusRestoreRef = useRef(false);
  const exitTimersRef = useRef<Map<string, number>>(new Map());

  const taskById = useMemo(() => {
    const m = new Map<string, Task>();
    for (const t of initialTasks) {
      m.set(t.id, t);
    }
    return m;
  }, [initialTasks]);

  const cancelDelete = useCallback(() => {
    pendingDeleteFocusRestoreRef.current = true;
    setPendingDeleteId(null);
    setShowDeleteDialog(false);
  }, []);

  useEffect(() => {
    const taskIds = initialTasks.map((t) => t.id);
    const titles = initialTasks.reduce<Record<string, string>>((acc, task) => {
      acc[task.id] = task.title;
      return acc;
    }, {});

    queueMicrotask(() => {
      setTaskOrder((currentOrder) => {
        const newOrder = currentOrder.filter((id) => taskIds.includes(id));
        for (const id of taskIds) {
          if (!newOrder.includes(id)) {
            newOrder.push(id);
          }
        }
        return newOrder;
      });
      setLocalTitles(titles);
    });
  }, [initialTasks]);

  useEffect(() => {
    if (editingTaskId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTaskId]);

  useEffect(() => {
    if (showDeleteDialog) return;
    if (!pendingDeleteFocusRestoreRef.current) return;
    pendingDeleteFocusRestoreRef.current = false;
    queueMicrotask(() => {
      deleteTriggerRef.current?.focus();
      deleteTriggerRef.current = null;
    });
  }, [showDeleteDialog]);

  useEffect(() => {
    const timers = exitTimersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  const handleEditClick = useCallback(
    (taskId: string) => {
      const next =
        localTitles[taskId] ?? taskById.get(taskId)?.title ?? "";
      editTitleRef.current = next;
      setEditingTaskId(taskId);
      setEditTitle(next);
    },
    [localTitles, taskById]
  );

  const handleEditChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      editTitleRef.current = v;
      setEditTitle(v);
    },
    []
  );

  const handleSave = useCallback(
    (taskId: string) => {
      const trimmed = editTitleRef.current.trim();
      if (!trimmed) return;
      setLocalTitles((prev) => ({
        ...prev,
        [taskId]: trimmed,
      }));
      onUpdate(taskId, trimmed);
      setEditingTaskId(null);
      editTitleRef.current = "";
      setEditTitle("");
    },
    [onUpdate]
  );

  const handleCancel = useCallback(() => {
    setEditingTaskId(null);
    editTitleRef.current = "";
    setEditTitle("");
  }, []);

  const handleDelete = useCallback((taskId: string) => {
    pendingDeleteFocusRestoreRef.current = false;
    deleteTriggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setPendingDeleteId(taskId);
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(() => {
    pendingDeleteFocusRestoreRef.current = false;
    deleteTriggerRef.current = null;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    setShowDeleteDialog(false);
    if (!id) return;

    const exitMs =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true
        ? 0
        : 320;

    setExitingTaskIds((prev) => new Set(prev).add(id));

    const prevTimer = exitTimersRef.current.get(id);
    if (prevTimer) clearTimeout(prevTimer);

    const runDelete = () => {
      exitTimersRef.current.delete(id);
      onDelete(id);
      setExitingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    };

    if (exitMs === 0) {
      queueMicrotask(runDelete);
    } else {
      exitTimersRef.current.set(id, window.setTimeout(runDelete, exitMs));
    }
  }, [pendingDeleteId, onDelete]);

  const handleEditInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, taskId: string) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const trimmed = editTitleRef.current.trim();
        if (!trimmed) return;
        setLocalTitles((prev) => ({
          ...prev,
          [taskId]: trimmed,
        }));
        onUpdate(taskId, trimmed);
        setEditingTaskId(null);
        editTitleRef.current = "";
        setEditTitle("");
      } else if (e.key === "Escape") {
        e.preventDefault();
        setEditingTaskId(null);
        editTitleRef.current = "";
        setEditTitle("");
      }
    },
    [onUpdate]
  );

  const onDragStartRow = useCallback((id: string) => {
    setDraggedId(id);
  }, []);

  const onDragOverRow = useCallback(
    (e: React.DragEvent<HTMLLIElement>, overId: string) => {
      e.preventDefault();
      if (!e.currentTarget) return;
      const bounding = e.currentTarget.getBoundingClientRect();
      const offset = e.clientY - bounding.top;
      const position: "above" | "below" =
        offset < bounding.height / 2 ? "above" : "below";
      setDragOverId(overId);
      setDragOverPosition(position);
    },
    []
  );

  const onDropRow = useCallback(
    (e: React.DragEvent<HTMLLIElement>, droppedId: string) => {
      e.preventDefault();
      if (!draggedId || draggedId === droppedId) {
        setDraggedId(null);
        setDragOverId(null);
        setDragOverPosition(null);
        return;
      }
      setTaskOrder((prev) =>
        reorderTaskIdsAfterDrop(prev, draggedId, droppedId, dragOverPosition)
      );
      setDraggedId(null);
      setDragOverId(null);
      setDragOverPosition(null);
    },
    [draggedId, dragOverPosition]
  );

  const onDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
    setDragOverPosition(null);
  }, []);

  const onReorder = useCallback((taskId: string, direction: "up" | "down") => {
    setTaskOrder((prev) => {
      const idx = prev.indexOf(taskId);
      if (idx === -1) return prev;
      const swap = direction === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }, []);

  if (initialTasks.length === 0) {
    return (
      <TaskListEmpty
        variant={noResultsFromSearch ? "no-results" : "no-tasks"}
      />
    );
  }

  return (
    <>
      <ul
        className="flex flex-col gap-2 overflow-x-hidden"
        aria-label="Task list"
      >
        {taskOrder.map((taskId) => {
          const task = taskById.get(taskId);
          if (!task) return null;

          const isCompleted = task.completed;
          const isEditing = editingTaskId === task.id;
          const displayTitle = localTitles[task.id] ?? task.title;
          const dragging = draggedId === task.id;
          const isDragOver = dragOverId === task.id && draggedId !== task.id;
          const dragOverClass =
            isDragOver && dragOverPosition === "above"
              ? "task-list-drag-over-above"
              : isDragOver && dragOverPosition === "below"
                ? "task-list-drag-over-below"
                : "";
          const isLeaving = exitingTaskIds.has(task.id);
          const isEntering =
            recentlyAddedId != null && task.id === recentlyAddedId;
          const orderIndex = taskOrder.indexOf(task.id);
          const canMoveUp = orderIndex > 0;
          const canMoveDown =
            orderIndex !== -1 && orderIndex < taskOrder.length - 1;

          return (
            <TaskListRow
              key={task.id}
              task={task}
              displayTitle={displayTitle}
              highlightQuery={highlightQuery}
              isEditing={isEditing}
              editTitle={editTitle}
              inputRef={inputRef}
              isCompleted={isCompleted}
              dragging={dragging}
              dragOverClass={dragOverClass}
              isLeaving={isLeaving}
              isEntering={isEntering}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
              onToggleComplete={onToggleComplete}
              onEditTitleChange={handleEditChange}
              onEditInputKeyDown={handleEditInputKeyDown}
              onEditSave={handleSave}
              onEditCancel={handleCancel}
              onEditActivate={handleEditClick}
              onDelete={handleDelete}
              onReorder={onReorder}
              onDragStartRow={onDragStartRow}
              onDragOverRow={onDragOverRow}
              onDropRow={onDropRow}
              onDragEnd={onDragEnd}
            />
          );
        })}
      </ul>
      <DeleteTaskDialog
        open={showDeleteDialog}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />
    </>
  );
}

export default memo(TaskList);
