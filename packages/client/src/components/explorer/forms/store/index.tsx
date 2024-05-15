import { useEffect, useState } from "react";
import { DirSelection } from "../../../input";
import { Modal } from "../../../modal";
import "./workspace.css";

export const StoreForm = ({ visible }: { visible: boolean }) => {
  const [selectedPath, setSelectedPath] = useState("");

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
      <button>Save</button>
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
