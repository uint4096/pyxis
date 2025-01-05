import { addDevices, listDevices, type DeviceIds } from "../ffi";
import { create } from "zustand";

interface DevicesState {
  deviceIds: DeviceIds;
  create: (deviceIds: Array<string>) => Promise<void>;
  list: () => Promise<DeviceIds>;
}

export const useDevices = create<DevicesState>((set) => ({
  deviceIds: [],
  create: async (deviceIds) => await addDevices(deviceIds),

  list: async () => {
    const deviceIds = await listDevices();
    if (!deviceIds) {
      return [];
    }

    set({ deviceIds });

    return deviceIds;
  },
}));
