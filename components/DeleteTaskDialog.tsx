"use client";

import { memo, useRef, useEffect, useLayoutEffect } from "react";

type DeleteTaskDialogProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function DeleteTaskDialog({ open, onCancel, onConfirm }: DeleteTaskDialogProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickAway(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onCancel();
      }
    }

    document.addEventListener("mousedown", handleClickAway);
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, [open, onCancel]);

  useLayoutEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const modal = modalRef.current;
    if (!modal) return;

    const selector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const focusableInModal = () =>
      Array.from(modal.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => !el.hasAttribute("disabled")
      );

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = focusableInModal();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !modal.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !modal.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="task-list-modal-bg" role="presentation">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-delete-dialog-title"
        aria-describedby="task-delete-dialog-desc"
        className="z-50 flex min-w-[280px] flex-col gap-4 rounded-lg border border-zinc-300 bg-white p-6 shadow-md dark:border-zinc-700 dark:bg-zinc-900"
        tabIndex={-1}
      >
        <div
          id="task-delete-dialog-title"
          className="font-medium text-zinc-900 dark:text-zinc-100"
        >
          Are you sure you want to delete this task?
        </div>
        <p
          id="task-delete-dialog-desc"
          className="text-sm text-zinc-600 dark:text-zinc-400"
        >
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus-visible:ring-offset-zinc-900"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(DeleteTaskDialog);
