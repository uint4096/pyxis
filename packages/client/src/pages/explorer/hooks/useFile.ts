import { useCallback, useReducer } from "react";
import { reducer } from "./reducers/file.reducer";
import { File } from "../../../types";
import { WorkspaceConfig } from "../types";
import { readFileContent, saveContent } from "../../../ffi";
import { PATH_SEPARATOR } from "../../../utils";

type UseFileProps = {
  file?: File;
  initialContent?: string;
  workspacePath: string | undefined;
  workspaceConfig: WorkspaceConfig | undefined;
};

export const useFile = ({
  initialContent,
  file,
  workspacePath,
  workspaceConfig,
}: UseFileProps) => {
  const [fileWithContent, dispatch] = useReducer(reducer, {
    ...(file && { file }),
    content: initialContent,
  });

  const readFromPath = useCallback(
    async (selectedFile: File) => {
      if (!workspaceConfig) {
        //@todo: show toast message
        return;
      }

      const content = await readFileContent<string>({
        file: selectedFile,
        path: `${workspacePath}${PATH_SEPARATOR}${selectedFile.path}`,
      });

      if (content == null) {
        //@todo: handle error and show toast message
        return;
      }

      dispatch({ type: "save", args: { content, file: selectedFile } });
    },
    [workspaceConfig, workspacePath],
  );

  const writeToFile = useCallback(
    async (selectedFile: File, content: string) => {
      if (!workspaceConfig) {
        //@todo: show toast message
        return;
      }

      const res = await saveContent({
        path: `${workspacePath}${PATH_SEPARATOR}${selectedFile.path}`,
        file: selectedFile,
        content,
      });

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
