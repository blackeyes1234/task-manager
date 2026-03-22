"use client";

import { memo } from "react";

type TaskListEmptyProps = {
  variant: "no-results" | "no-tasks";
};

function TaskListEmpty({ variant }: TaskListEmptyProps) {
  if (variant === "no-results") {
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

export default memo(TaskListEmpty);
