"use client";

import { memo, useEffect, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const DEFAULT_DEBOUNCE_MS = 200;

export type TaskSearchFieldProps = {
  debounceMs?: number;
  onDebouncedChange: (query: string) => void;
};

function TaskSearchField({
  debounceMs = DEFAULT_DEBOUNCE_MS,
  onDebouncedChange,
}: TaskSearchFieldProps) {
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebouncedValue(searchText, debounceMs);

  useEffect(() => {
    onDebouncedChange(debouncedSearch);
  }, [debouncedSearch, onDebouncedChange]);

  return (
    <div className="mb-4 flex w-full flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
      <div className="relative min-w-0 flex-1">
        <input
          type="search"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search tasks…"
          aria-label="Search tasks"
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 pr-10 text-zinc-900 placeholder-zinc-500 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400 dark:focus:border-zinc-400 dark:focus:ring-zinc-700"
          autoComplete="off"
        />
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
          aria-hidden
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
      </div>
      <button
        type="button"
        onClick={() => setSearchText("")}
        disabled={searchText.length === 0}
        className="shrink-0 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        Clear
      </button>
    </div>
  );
}

export default memo(TaskSearchField);
