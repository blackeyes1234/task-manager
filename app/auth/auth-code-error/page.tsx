import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-4 text-center dark:bg-zinc-950">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Sign-in could not be completed
      </h1>
      <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        The authentication link may have expired or already been used. Try
        signing in again from the home page.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
      >
        Back to Task Manager
      </Link>
    </div>
  );
}
