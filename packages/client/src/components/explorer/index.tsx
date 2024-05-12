import { useEffect, useState } from "react";
import Editor from "../editor/editor";
import {
  read_store_config,
  read_system_config,
  read_worksapce_config,
} from "../../ffi";
import { StoreConfig, SystemConfig } from "./types";
import { Modal } from "../modal";
import './explorer.css';

export const Explorer = () => {
  const [showEditor, setEditor] = useState<boolean>(true);
  const [showModal, setModal] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      const systemConfig = await read_system_config<SystemConfig>({} as never);
      if (!systemConfig) {
        // setModal(true);
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

  return <div className='explorer'>
    {showEditor && <Editor />}
    {showModal && <Modal body={<></>} size="large" visible={showModal} allowClosing/>}
  </div>;
};
