import { saveStoreConfig } from "../ffi";
import { create } from "zustand";
import { StoreConfig } from "./types";

interface StoreState {
  config: Partial<StoreConfig>;
  path: string | undefined;
  initConfig: (config: StoreConfig, path: string) => void;
  saveToDisk: (config: StoreConfig) => Promise<void>;
  updateWorkspace: (w: StoreConfig["selected_workspace"]) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  config: {},

  path: undefined,

  initConfig: (config: StoreConfig, path) => set({ config, path }),

  updateWorkspace: async (
    selectedWorkspace: StoreConfig["selected_workspace"],
  ) => {
    const config = { ...get().config, selected_workspace: selectedWorkspace };
    await get().saveToDisk(<StoreConfig>config);
    set({ config });
  },

  saveToDisk: async (config) =>
    void saveStoreConfig<StoreConfig>({
      path: get().path ?? "",
      config,
    }),
}));
