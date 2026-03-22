"use client";

import { memo } from "react";
import type { Task } from "@/lib/types";
import { formatDueDateLabel, isDueDateOverdue } from "@/lib/formatDueDate";

function DueDateLabelInner({ task }: { task: Task }) {
  const label = formatDueDateLabel(task.dueDate);
  if (!label) return null;
  const overdue = isDueDateOverdue(task.dueDate, task.completed);
  return (
    <span
      className={
        overdue
          ? "text-xs font-medium text-red-600 dark:text-red-400"
          : "text-xs text-zinc-500 dark:text-zinc-400"
      }
    >
      {label}
    </span>
  );
}

export const DueDateLabel = memo(DueDateLabelInner);
