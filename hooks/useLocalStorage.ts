import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

export type LocalStorageReadFallbackReason = "storage_error" | "invalid_data";

export interface UseLocalStorageOptions<T> {
  /** Convert stored string to value; return `null` if invalid or corrupt. */
  deserialize?: (raw: string) => T | null;
  /** Convert value to string for storage (default: JSON.stringify). */
  serialize?: (value: T) => string;
  /** Called when persisting to `localStorage` fails (quota, private mode, etc.). */
  onWriteError?: () => void;
  /**
   * Called when stored data cannot be used: `localStorage` access threw, or
   * `deserialize` returned `null` for non-empty stored data (corrupt / wrong shape).
   */
  onReadFallback?: (reason: LocalStorageReadFallbackReason) => void;
}

function defaultSerialize<T>(value: T): string {
  return JSON.stringify(value);
}

function defaultDeserialize<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Persists state in `localStorage` under `key`.
 * - Loads after mount (safe for Next.js client components / hydration).
 * - Writes whenever `value` changes after the initial read.
 * - Missing or empty `localStorage` uses `initialValue` without throwing.
 * - Invalid JSON or deserialize returning `null` falls back to `initialValue`.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): [T, Dispatch<SetStateAction<T>>] {
  const optionsRef = useRef(options);
  const initialRef = useRef(initialValue);

  useLayoutEffect(() => {
    optionsRef.current = options;
    initialRef.current = initialValue;
  });

  const [value, setValue] = useState<T>(initialValue);
  const [hasRead, setHasRead] = useState(false);

  // Load when `key` changes (client-only; effect does not run on server)
  useEffect(() => {
    let readFallbackReason: LocalStorageReadFallbackReason | null = null;

    try {
      const raw = localStorage.getItem(key);
      const deserialize =
        optionsRef.current.deserialize ?? defaultDeserialize<T>;
      const fallback = initialRef.current;

      if (raw === null) {
        setValue(fallback);
      } else {
        const parsed = deserialize(raw);
        if (parsed !== null) {
          setValue(parsed);
        } else {
          readFallbackReason = "invalid_data";
          setValue(fallback);
        }
      }
    } catch {
      readFallbackReason = "storage_error";
      setValue(initialRef.current);
    }

    if (readFallbackReason !== null) {
      optionsRef.current.onReadFallback?.(readFallbackReason);
    }

    setHasRead(true);
  }, [key]);

  // Persist after initial read (avoids overwriting storage before load completes)
  useEffect(() => {
    if (!hasRead) return;

    try {
      const serialize =
        optionsRef.current.serialize ?? defaultSerialize<T>;
      localStorage.setItem(key, serialize(value));
    } catch {
      optionsRef.current.onWriteError?.();
    }
  }, [key, value, hasRead]);

  const setStoredValue = useCallback<Dispatch<SetStateAction<T>>>(
    (update) => {
      setValue((prev) =>
        typeof update === "function"
          ? (update as (p: T) => T)(prev)
          : update
      );
    },
    []
  );

  return [value, setStoredValue];
}
