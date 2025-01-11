import { type Sources, getLastSyncedRecordId } from "../ffi";
import { create } from "zustand";

interface DevicesState {
  getSyncedRecordId: (
    deviceId: string,
    sources: Array<Sources>,
  ) => Promise<number | undefined>;
}

export const useTracker = create<DevicesState>(() => ({
  async getSyncedRecordId(deviceId, sources) {
    return getLastSyncedRecordId(deviceId, sources);
  },
}));
