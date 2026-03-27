# Task Manager

A task manager built with Next.js (App Router) and Supabase. Tasks are stored in a Postgres database so your data is not limited to one browser.

## Features

- **Tasks** — Add tasks with optional **priority** (High / Medium / Low) and **due date**. **Edit** titles inline (keyboard: activate with Enter/Space on the title, save with Enter, cancel with Escape). **Delete** with a confirmation dialog.
- **Filters** — Show **All**, **Active**, or **Completed** tasks.
- **Search** — Debounced search across title, priority, and due date; matching text is **highlighted** in the list.
- **Reorder** — **Drag-and-drop** to reorder rows. **Keyboard:** use **Move up** / **Move down** on each row (toolbar also notes that drag is mouse-oriented and buttons are for keyboard users).
- **Persistence** — Tasks are saved in **Supabase Postgres** and loaded when the app starts.
- **Theme** — **Light** / **dark** toggle; preference is stored under **`task-manager-theme`** and respects `prefers-color-scheme` until you choose a theme.
- **Feedback** — **Toasts** for successes (add, update, delete) and errors (e.g. storage read/write failures).
- **Accessibility** — **Skip to main content** link, form and control **`aria-label`s**, validation **`aria-invalid`** / **`aria-describedby`**, delete **dialog** pattern, toast **`role="alert"`** / **`aria-live`** where appropriate, and reorder controls exposed for keyboard and screen readers.

> **Note:** List order from drag-and-drop or move buttons is still local UI state. After a reload, tasks are ordered by creation time from the database.

## Tech stack

- [Next.js](https://nextjs.org/) 16 (App Router), React 19, TypeScript
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Supabase](https://supabase.com/) (`@supabase/supabase-js`)
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
3. Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Restart the dev server after changing environment variables.

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
- `lib/` — Types, Supabase client/API, search/highlight utilities, theme init script
- `supabase/` — SQL schema used by the app

## Environment & deployment

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your deployment environment (e.g. [Vercel](https://vercel.com/)).

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
