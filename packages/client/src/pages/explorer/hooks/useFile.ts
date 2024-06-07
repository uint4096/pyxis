import { useCallback, useContext, useReducer } from "react";
import { reducer } from "./reducers/file.reducer";
import { File } from "../../../types";
import { pathToDir } from "./reducers/utils/path-to-dir";
import { WorkspaceConfig } from "../types";
import { readFileContent, saveContent } from "../../../ffi";
import { ConfigContext, TConfigContext } from "..";

type UseFileProps = {
  file?: File;
  initialContent?: string;
  workspacePath: string | undefined;
  workspaceConfig: WorkspaceConfig | undefined;
};

export const useFile = ({ initialContent, file }: UseFileProps) => {
  const [fileWithContent, dispatch] = useReducer(reducer, {
    ...(file && { file }),
    content: initialContent,
  });

  const { workspaceConfig, workspacePath } =
    useContext<TConfigContext>(ConfigContext);

  const readFromPath = useCallback(
    async (targetId: string, selectedFile: File) => {
      if (!workspaceConfig) {
        //@todo: show toast message
        return;
      }

      const { path } = pathToDir(targetId, workspaceConfig.tree, workspacePath);
      const content = await readFileContent<string>({
        file: selectedFile,
        path,
      });

      if (content == null) {
        //@todo: handle error and show toast message
        return;
      }

      dispatch({ type: "save", args: { content } });
    },
    [workspaceConfig, workspacePath],
  );

  const writeToFile = useCallback(
    async (targetId: string, selectedFile: File, content: string) => {
      if (!workspaceConfig) {
        //@todo: show toast message
        return;
      }

      const { path } = pathToDir(targetId, workspaceConfig.tree, workspacePath);
      const res = await saveContent({ path, file: selectedFile, content });

      if (!res) {
        //@todo: handle error and show toast message
        return;
      }
    },
    [workspaceConfig, workspacePath],
  );

  return {
    fileWithContent,
    readFromPath,
    writeToFile,
  };
};
