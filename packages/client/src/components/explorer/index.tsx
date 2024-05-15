import { useEffect, useState } from "react";
import Editor from "../editor/editor";
import {
  read_store_config,
  read_system_config,
  read_worksapce_config,
} from "../../ffi";
import { StoreConfig, SystemConfig } from "./types";
import "./explorer.css";
import { StoreForm } from "./forms/store";

export const Explorer = () => {
  const [showEditor, setEditor] = useState<boolean>(true);
  const [showModal, setModal] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const systemConfig = await read_system_config<SystemConfig>({} as never);
      if (!systemConfig || !systemConfig.store) {
        setModal(true);
        return;
      }

      const storeConfig = await read_store_config<StoreConfig>({
        path: systemConfig.store,
      });

      if (!storeConfig || !storeConfig.last_selected_workspace) {
        //Show workspaces Modal
        return;
      }

      const workspaceConfig = await read_worksapce_config({
        path: `${systemConfig.store}/${storeConfig.last_selected_workspace.name}`,
      });
      if (!workspaceConfig) {
        // Show worksapces modal
        // Corrupted workspace? @todo: How can we handle this?
        return;
      }

      setEditor(true);
    })();
  }, []);

  return (
    <div className="explorer">
      {showEditor && <Editor />}
      {showModal && <StoreForm visible={showModal} />}
    </div>
  );
};
