import { invoke } from "./invoke";

export type DeviceIds = Array<string>;

type Args = {
  add_devices: { deviceIds: DeviceIds };
  list_devices: never;
};

export const addDevices = async (deviceIds: DeviceIds) => {
  try {
    await invoke<Args, boolean>()("add_devices", { deviceIds });
  } catch (e) {
    console.error("[Device] Failed to add devices!", e);
  }
};

export const listDevices = async (): Promise<DeviceIds | void> => {
  try {
    const device_ids = await invoke<Args, DeviceIds>()(
      "list_devices",
      {} as never,
    );

    if (!device_ids) {
      throw new Error("Empty response");
    }

    return device_ids;
  } catch (e) {
    console.error("[Device] Failed to list devices!", e);
  }
};
