import { create } from "zustand";
import type { File } from "../types";
import { readFileContent, saveContent } from "../ffi";
import { PATH_SEPARATOR } from "../utils";

export type FileStore = {
  file: Partial<File>;
  content: string;
  unselect: () => void;
  select: (file: File) => void;
  readFromDisk: (workspacePath: string) => Promise<void>;
  saveToDisk: (workspacePath: string) => (content: string) => Promise<void>;
};

export const useFile = create<FileStore>((set, get) => ({
  file: {},

  content: "",

  select: (file: File) => set({ file }),

  unselect: () => set({ file: {} }),

  readFromDisk: async (workspacePath) => {
    const { file } = get();
    if (!file.name) {
      //@todo: handle error and show toast message
      return;
    }

    const content = await readFileContent<string>({
      file: <File>file,
      path: `${workspacePath}${file.path}`,
    });

    if (content == null) {
      //@todo: handle error and show toast message
      return;
    }

    set({ content });
  },

  saveToDisk: (workspacePath) => async (content) => {
    const { file } = get();
    if (!file.name) {
      //@todo: handle error and show toast message
      return;
    }

    const res = await saveContent({
      path: `${workspacePath}${PATH_SEPARATOR}${file.path}`,
      file: <File>file,
      content,
    });

    if (!res) {
      //@todo: handle error and show toast message
      return;
    }
  },
}));
