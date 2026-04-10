import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

type ValidateStoredValue<T> = (value: string | null) => T | null;

interface UseStoredStateOptions<T> {
  key: string;
  defaultValue: T;
  validate?: ValidateStoredValue<T>;
}

export function useStoredState<T>({
  key,
  defaultValue,
  validate,
}: UseStoredStateOptions<T>): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return defaultValue;
    }

    const storedValue = window.localStorage.getItem(key);
    const nextValue = validate?.(storedValue);

    if (nextValue !== null && nextValue !== undefined) {
      return nextValue;
    }

    return defaultValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, String(value));
  }, [key, value]);

  return [value, setValue];
}
