import { addDevices, listDevices, type DeviceIds } from "../ffi";
import { create } from "zustand";

interface DevicesState {
  create: (deviceIds: Array<string>) => Promise<void>;
  list: () => Promise<DeviceIds>;
}

export const useDevices = create<DevicesState>(() => ({
  create: async (deviceIds) => {
    if (!deviceIds.length) {
      return;
    }

    await addDevices(deviceIds);
  },

  list: async () => {
    const deviceIds = await listDevices();
    if (!deviceIds) {
      return [];
    }

    return deviceIds;
  },
}));
