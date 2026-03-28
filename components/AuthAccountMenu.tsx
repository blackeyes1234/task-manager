"use client";

import { useCallback, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";

type AuthAccountMenuProps = {
  supabase: SupabaseClient;
  user: User;
};

export default function AuthAccountMenu({
  supabase,
  user,
}: AuthAccountMenuProps) {
  const [busy, setBusy] = useState(false);

  const signOut = useCallback(async () => {
    setBusy(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setBusy(false);
    }
  }, [supabase]);

  const label =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email ??
    "Signed in";

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <p className="max-w-[14rem] truncate text-right text-xs text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <button
        type="button"
        onClick={() => void signOut()}
        disabled={busy}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
      >
        {busy ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
