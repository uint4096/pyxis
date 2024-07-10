import { saveSystemConfig } from "../ffi";
import { create } from "zustand";
import { SystemConfig } from "./types";

interface StoreState {
  config: Partial<SystemConfig>;
  initConfig: (config: SystemConfig) => void;
  saveToDisk: (config: SystemConfig) => Promise<void>;
}

export const useSystem = create<StoreState>((set) => ({
  config: {},

  initConfig: (config: SystemConfig) => set({ config }),

  saveToDisk: async (config) => {
    await saveSystemConfig<SystemConfig>({
      config,
    });

    set({ config });
  },
}));
