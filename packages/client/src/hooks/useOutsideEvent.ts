import { RefObject, useCallback, useEffect } from "react";

export const useOutsideEvent = <T extends HTMLElement>(
  ref: RefObject<T | undefined>,
  onClick: () => void
) => {
  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (ref.current && e.target && !ref.current.contains(<Node>e.target)) {
        onClick();
      }
    },
    [ref]
  );

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [ref]);
};
