import { useCallback, useState } from "react";
import { DirSelection } from "../../../input";
import { Modal } from "../../../modal";
import "./workspace.css";
import { save_config } from "../../../../ffi";
import { SystemConfig } from "../../types";

export const StoreForm = ({ visible }: { visible: boolean }) => {
  const [selectedPath, setSelectedPath] = useState("");
  const onSave = useCallback(async () => {
    const saveResponse = await save_config<SystemConfig, "write_system_config">(
      "write_system_config",
      { config: { store: selectedPath } }
    );
    console.log("Save response", saveResponse);
  }, [selectedPath]);

  const body = (
    <div className="ws-form-wrapper">
      <DirSelection
        value={selectedPath}
        placeholder="Path to workspaces..."
        size="medium"
        onChange={setSelectedPath}
        message="Select a directory to store your workspaces"
      />
    </div>
  );

  const footer = (
    <div className="ws-form-footer">
      <button onClick={onSave}>Save</button>
    </div>
  );

  return (
    <div className="ws-form-container">
      <Modal
        allowClosing={false}
        body={body}
        size="small"
        visible={visible}
        footer={footer}
      />
    </div>
  );
};
