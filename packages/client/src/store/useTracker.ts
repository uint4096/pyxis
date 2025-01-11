import { type Sources, getLastSyncedRecordId, addSyncedRecord } from "../ffi";
import { create } from "zustand";

interface DevicesState {
  getSyncedRecordId: (
    deviceId: string,
    sources: Array<Sources>,
  ) => Promise<number | undefined>;

  updateRecord: (
    deviceId: string,
    source: Sources,
    recordId: number,
  ) => Promise<void>;
}

export const useTracker = create<DevicesState>(() => ({
  async getSyncedRecordId(deviceId, sources) {
    return await getLastSyncedRecordId(deviceId, sources);
  },
  async updateRecord(deviceId, source, recordId) {
    return await addSyncedRecord(deviceId, source, recordId);
  },
}));
