# Task Manager

A client-side task manager built with Next.js (App Router). Tasks live in the browser: add, edit, filter, search, and organize them without a backend.

## Features

- **Tasks** — Add tasks with optional **priority** (High / Medium / Low) and **due date**. **Edit** titles inline (keyboard: activate with Enter/Space on the title, save with Enter, cancel with Escape). **Delete** with a confirmation dialog.
- **Filters** — Show **All**, **Active**, or **Completed** tasks.
- **Search** — Debounced search across title, priority, and due date; matching text is **highlighted** in the list.
- **Reorder** — **Drag-and-drop** to reorder rows. **Keyboard:** use **Move up** / **Move down** on each row (toolbar also notes that drag is mouse-oriented and buttons are for keyboard users).
- **Persistence** — Tasks are saved to **`localStorage`** under the key **`task-manager-tasks`**. Corrupt or unreadable data falls back to an empty list with an error toast.
- **Theme** — **Light** / **dark** toggle; preference is stored under **`task-manager-theme`** and respects `prefers-color-scheme` until you choose a theme.
- **Feedback** — **Toasts** for successes (add, update, delete) and errors (e.g. storage read/write failures).
- **Accessibility** — **Skip to main content** link, form and control **`aria-label`s**, validation **`aria-invalid`** / **`aria-describedby`**, delete **dialog** pattern, toast **`role="alert"`** / **`aria-live`** where appropriate, and reorder controls exposed for keyboard and screen readers.

> **Note:** List order from drag-and-drop or move buttons is kept in component state for the current session. After a full page reload, tasks appear in the order stored in `localStorage` (typically creation/update order).

## Tech stack

- [Next.js](https://nextjs.org/) 16 (App Router), React 19, TypeScript
- [Tailwind CSS](https://tailwindcss.com/) v4
- Tests: Jest, Testing Library (`@testing-library/react`, `user-event`)

## Getting started

**Requirements:** Node.js 20+ recommended (aligns with `@types/node` in the project).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
- `hooks/` — `useLocalStorage`, `useToasts`
- `lib/` — Types, storage helpers, search/highlight utilities, theme init script

## Environment & deployment

No environment variables are required for core functionality. The app can be deployed like any Next.js app (e.g. [Vercel](https://vercel.com/)). Data stays in each visitor’s browser only.

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
