import { type Sources, getLastSyncedRecordId, addSyncedRecord } from "../ffi";
import { create } from "zustand";

interface DevicesState {
  getSyncedRecordId: (
    deviceId: string,
    sources: Array<Sources>,
    userId: string,
  ) => Promise<number | undefined>;

  updateRecord: (
    deviceId: string,
    source: Sources,
    recordId: number,
    userId: string,
  ) => Promise<void>;
}

export const useTracker = create<DevicesState>(() => ({
  async getSyncedRecordId(deviceId, sources, userId) {
    return await getLastSyncedRecordId(deviceId, sources, userId);
  },
  async updateRecord(deviceId, source, recordId, userId) {
    return await addSyncedRecord(deviceId, source, recordId, userId);
  },
}));
