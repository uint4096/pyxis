import { useCallback, useEffect, useState } from "react";
import { ky } from "../utils";

export const useOffline = () => {
  const [isOnline, setOnline] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await ky.get("/sync/ping");
        setOnline(true);
      } catch {
        setOnline(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const networkCall = useCallback(
    async <T>(
      func: () => Promise<T>,
      options?: {
        onError?: (e: unknown) => Promise<T | undefined>;
        onOffline?: () => Promise<T | undefined>;
      },
    ): Promise<{
      status: "resolved" | "rejected" | "offline";
      response: T | undefined;
    }> => {
      const { onError, onOffline } = options ?? {};
      if (isOnline) {
        try {
          return { status: "resolved", response: await func() };
        } catch (e) {
          if (onError) {
            return { status: "rejected", response: await onError(e) };
          } else {
            throw e;
          }
        }
      } else {
        return { status: "offline", response: await onOffline?.() };
      }
    },
    [isOnline],
  );

  return { networkCall, isOnline };
};
