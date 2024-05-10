import { useEffect, useState } from "react";
import Editor from "../editor/editor";
import {
  read_store_config,
  read_system_config,
  read_worksapce_config,
} from "../../ffi";
import { StoreConfig, SystemConfig } from "./types";

export const Explorer = () => {
  const [showEditor, setEditor] = useState<boolean>();

  useEffect(() => {
    (async () => {
      const systemConfig = await read_system_config<SystemConfig>({} as never);
      if (!systemConfig) {
        //Show Modal
        return;
      }

      const storeConfig = await read_store_config<StoreConfig>({
        path: systemConfig.store,
      });
      if (!storeConfig) {
        //Show Modal
        return;
      }

      const workspaceConfig = await read_worksapce_config({
        path: `${systemConfig.store}/${storeConfig.last_selected_workspace.name}`,
      });
      if (!workspaceConfig) {
        //Show Modal
        return;
      }

      setEditor(true);
    })();
  }, []);

  return <>{showEditor && <Editor />}</>;
};
