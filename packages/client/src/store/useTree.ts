import { create } from "zustand";
import type { DirectoryState, FileState } from "./types";
import { dirSlice } from "./useDirectory";
import { fileSlice } from "./useFile";

export const useTreeStore = create<DirectoryState & FileState>()((...a) => ({
  ...dirSlice(...a),
  ...fileSlice(...a),
}));
