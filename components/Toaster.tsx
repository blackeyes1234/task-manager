"use client";

import { memo } from "react";
import type { ToastItem } from "@/hooks/useToasts";

type ToasterProps = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m22 4-10 10-3-3" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}

function Toaster({ toasts, onDismiss }: ToasterProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(100vw-2rem,22rem)] flex-col gap-2"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const isError = toast.variant === "error";
        return (
          <div
            key={toast.id}
            role={isError ? "alert" : "status"}
            aria-live={isError ? "assertive" : "polite"}
            className={[
              "toast-enter pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg transition-all duration-300 ease-out dark:shadow-black/40",
              toast.exiting ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100",
              isError
                ? "border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/90 dark:text-red-100"
                : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/90 dark:text-emerald-100",
            ].join(" ")}
          >
            <span
              className={
                isError
                  ? "text-red-600 dark:text-red-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }
            >
              {isError ? <ErrorIcon /> : <CheckIcon />}
            </span>
            <p className="min-w-0 flex-1 leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="-m-1 shrink-0 rounded p-1 text-current opacity-70 outline-none transition hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
              aria-label="Dismiss notification"
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
                aria-hidden
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default memo(Toaster);
