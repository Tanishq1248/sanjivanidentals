import { useState, useEffect } from "react";

/**
 * Debounces a value by the given delay.
 * The returned value only updates after the user has stopped changing the
 * input for `delayMs` milliseconds, preventing rapid-fire Firestore reads
 * on every keystroke.
 *
 * @param value   - The raw value to debounce (e.g. a search string).
 * @param delayMs - Debounce window in ms. Defaults to 400 ms.
 * @returns The debounced value.
 *
 * @example
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebounce(search, 400);
 *
 * // Fire Firestore query only when debouncedSearch changes, not on every keystroke.
 * useEffect(() => { fetchData(debouncedSearch); }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    // Cancel the pending timer if value changes before the delay expires.
    // This prevents stale search queries from executing.
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
