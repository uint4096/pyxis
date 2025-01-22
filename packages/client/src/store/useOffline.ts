import { create } from "zustand";

type State = "offline" | "online";

interface NetworkState {
  status: State;
  setStatus: (status: State) => void;
  getStatus: () => State;
  networkCall: <T>(
    func: () => Promise<T>,
    options?: {
      onError?: (e: unknown) => Promise<T | undefined>;
      onOffline?: () => Promise<T | undefined>;
    },
  ) => Promise<{
    status: "resolved" | "rejected" | "offline";
    response: T | undefined;
  }>;
}

export const useOffline = create<NetworkState>((set, get) => ({
  status: "offline",
  setStatus: (status) => set({ status }),
  getStatus: () => get().status,
  networkCall: async <T>(
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
    if (get().status === "online") {
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
}));
