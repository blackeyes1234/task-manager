import { useCallback, useEffect, useRef, useState } from "react";

export type ToastVariant = "success" | "error";

export type ToastItem = {
  id: string;
  variant: ToastVariant;
  message: string;
  exiting?: boolean;
};

const DISPLAY_MS = 3000;
const EXIT_MS = 300;

function createToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const clearTimersFor = useCallback((id: string) => {
    const auto = timersRef.current.get(id);
    if (auto) clearTimeout(auto);
    timersRef.current.delete(id);
    const rem = timersRef.current.get(`${id}-remove`);
    if (rem) clearTimeout(rem);
    timersRef.current.delete(`${id}-remove`);
  }, []);

  const finalizeRemove = useCallback((id: string) => {
    clearTimersFor(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, [clearTimersFor]);

  const startExit = useCallback(
    (id: string) => {
      clearTimersFor(id);
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
      const rem = setTimeout(() => finalizeRemove(id), EXIT_MS);
      timersRef.current.set(`${id}-remove`, rem);
    },
    [clearTimersFor, finalizeRemove]
  );

  const dismissToast = useCallback(
    (id: string) => {
      startExit(id);
    },
    [startExit]
  );

  const pushToast = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = createToastId();
      setToasts((prev) => [{ id, variant, message }, ...prev]);
      const auto = setTimeout(() => startExit(id), DISPLAY_MS);
      timersRef.current.set(id, auto);
    },
    [startExit]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  return { toasts, pushToast, dismissToast };
}
