import { useEffect, useState } from "react";

export const useDebounce = <T>(state: T, timeInSeconds: number) => {
  const [debouncedState, setDebouncedState] = useState<T>();

  useEffect(() => {
    const debouncedTimeout = setTimeout(
      () => setDebouncedState(state),
      timeInSeconds * 1000,
    );

    return () => clearTimeout(debouncedTimeout);
  }, [state, timeInSeconds]);

  return debouncedState;
};
