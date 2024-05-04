import { useEffect, useState } from "react";
import Editor from "../editor/editor";
import { read_config } from "../../ffi";

export const Explorer = () => {
  const [showEditor, setEditor] = useState<boolean>();

  useEffect(() => {
    (async () => {
      const mainConfig = await read_config(
        "/home/abhishek/personal_projects/pyxis/packages/client/package.json"
      );
      if (!mainConfig) {
        //Show Modal
        return;
      }

      const workspaceConfig = await read_config(
        "/home/abhishek/personal_projects/pyxis/packages/client/package.json"
      );
      if (!workspaceConfig) {
        //Show Modal
        return;
      }

      setEditor(true);
    })();
  }, []);

  return <>{showEditor && <Editor />}</>;
};
