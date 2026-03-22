import { useEffect, useState } from "react";

/**
 * Returns a value that updates after `delay` ms of stability.
 * Useful for search/filter to avoid work on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
