"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 px-4 py-12 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <div className="mx-auto w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            A critical error occurred while loading the app. Try again or
            refresh the page.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
