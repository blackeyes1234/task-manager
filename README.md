# Task Manager

A task manager built with Next.js (App Router) and Supabase. Tasks are stored in a Postgres database so your data is not limited to one browser.

## Features

- **Tasks** — Add tasks with optional **priority** (High / Medium / Low) and **due date**. **Edit** titles inline (keyboard: activate with Enter/Space on the title, save with Enter, cancel with Escape). **Delete** with a confirmation dialog.
- **Filters** — Show **All**, **Active**, or **Completed** tasks.
- **Search** — Debounced search across title, priority, and due date; matching text is **highlighted** in the list.
- **Reorder** — **Drag-and-drop** to reorder rows. **Keyboard:** use **Move up** / **Move down** on each row. Order is **saved in Supabase** (`position` per task). While **search** has text, reorder is disabled (clear search to drag or use move buttons).
- **Sign-in** — **Google** OAuth via Supabase Auth. Tasks are private to your account.
- **Persistence** — Tasks are saved in **Supabase Postgres** (per user) and loaded after sign-in.
- **Live updates** — While signed in, the list **refreshes from the server** when tasks change (Supabase **Realtime** on `tasks`, plus a refetch when you **return to the tab**). That includes **reorder** (drag or move up/down) on another device once the DB migration below is applied. Run `supabase/migration_enable_realtime_tasks.sql` once so Postgres publishes `tasks` to Realtime, and `supabase/migration_realtime_and_atomic_reorder.sql` once so **position updates** broadcast reliably and **reorder is atomic** (single RPC).
- **Theme** — **Light** / **dark** toggle; preference is stored under **`task-manager-theme`** and respects `prefers-color-scheme` until you choose a theme.
- **Feedback** — **Toasts** for successes (add, update, delete) and errors (e.g. storage read/write failures).
- **Accessibility** — **Skip to main content** link, form and control **`aria-label`s**, validation **`aria-invalid`** / **`aria-describedby`**, delete **dialog** pattern, toast **`role="alert"`** / **`aria-live`** where appropriate, and reorder controls exposed for keyboard and screen readers.

> **Note:** If your database was created before manual order existed, run `supabase/migration_add_task_position.sql` once to add the `position` column and backfill.

## Tech stack

- [Next.js](https://nextjs.org/) 16 (App Router), React 19, TypeScript
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Supabase](https://supabase.com/) (`@supabase/supabase-js`, `@supabase/ssr`)
- Tests: Jest, Testing Library (`@testing-library/react`, `user-event`)

## Getting started

**Requirements:** Node.js 20+ recommended (aligns with `@types/node` in the project).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase setup

1. Create a Supabase project.
2. Run the SQL in `supabase/schema.sql` in the Supabase SQL editor.  
   If you already had a `tasks` table without `user_id`, run `supabase/migration_add_user_rls.sql` instead (or after aligning your table).  
   If your `tasks` table has no `position` column yet, run `supabase/migration_add_task_position.sql` once.  
   For **updates from other devices/tabs**, run `supabase/migration_enable_realtime_tasks.sql` once (or enable **Replication** for `tasks` under **Database → Publications** in the dashboard).  
   For **live reorder sync**, also run `supabase/migration_realtime_and_atomic_reorder.sql` once (`replica identity full` + `reorder_tasks` RPC).
3. **Authentication → Providers → Google**: enable and add your Google OAuth client ID/secret (Google Cloud Console). Under **URL configuration**, add your site URL and redirect URLs (e.g. `http://localhost:3000/**`, `https://your-app.vercel.app/**`).
4. Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. Restart the dev server after changing environment variables.

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Development server       |
| `npm run build`   | Production build         |
| `npm run start`   | Run production server    |
| `npm run lint`    | ESLint                   |
| `npm test`        | Run tests once           |
| `npm run test:watch` | Jest in watch mode   |

## Project structure (overview)

- `app/` — App Router entry (`page.tsx`), global styles, `error.tsx` / `global-error.tsx` for unexpected errors
- `components/` — UI: task form, list, rows, search, theme toggle, toasts, dialogs
- `hooks/` — `useToasts`
- `lib/` — Types, Supabase browser/server clients, task API, search/highlight utilities, theme init script
- `middleware.ts` — Refreshes Supabase auth session cookies
- `app/auth/callback` — OAuth redirect handler for Google sign-in
- `supabase/` — SQL schema used by the app

## Environment & deployment

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your deployment environment (e.g. [Vercel](https://vercel.com/)).

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
