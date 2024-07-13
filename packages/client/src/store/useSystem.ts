import { readSystemConfig, saveSystemConfig } from "../ffi";
import { create } from "zustand";
import { SystemConfig } from "./types";

interface StoreState {
  config: Partial<SystemConfig>;
  initConfig: (config: SystemConfig) => void;
  saveToDisk: (config: SystemConfig) => Promise<void>;
  readFromDisk: () => Promise<Partial<SystemConfig>>;
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

  readFromDisk: async () => {
    const config = (await readSystemConfig<SystemConfig>({} as never)) ?? {};
    set({ config });

    return config;
  },
}));
