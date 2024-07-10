import { useCallback, useReducer } from "react";
import { reducer } from "./reducers/file.reducer";
import { File } from "../../../types";
import { WorkspaceConfig } from "../../../store/types";
import { readFileContent, saveContent } from "../../../ffi";
import { PATH_SEPARATOR } from "../../../utils";
import { useWorkspace } from "../../../store/useWorkspace";

type UseFileProps = {
  file?: File;
  initialContent?: string;
  workspaceConfig: Partial<WorkspaceConfig> | undefined;
};

export const useFile = ({
  initialContent,
  file,
  workspaceConfig,
}: UseFileProps) => {
  const { path } = useWorkspace();
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
        path: `${path}${PATH_SEPARATOR}${selectedFile.path}`,
      });

      if (content == null) {
        //@todo: handle error and show toast message
        return;
      }

      dispatch({ type: "save", args: { content, file: selectedFile } });
    },
    [path, workspaceConfig],
  );

  const writeToFile = useCallback(
    async (selectedFile: File, content: string) => {
      if (!workspaceConfig) {
        //@todo: show toast message
        return;
      }

      const res = await saveContent({
        path: `${path}${PATH_SEPARATOR}${selectedFile.path}`,
        file: selectedFile,
        content,
      });

      if (!res) {
        //@todo: handle error and show toast message
        return;
      }
    },
    [path, workspaceConfig],
  );

  return {
    fileWithContent,
    readFromPath,
    writeToFile,
  };
};
