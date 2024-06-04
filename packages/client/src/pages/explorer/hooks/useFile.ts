import { useCallback, useReducer } from "react";
import { reducer } from "./reducers/file.reducer";
import { File } from "../../../types";
import { pathToDir } from "./reducers/utils/path-to-dir";
import { WorkspaceConfig } from "../types";
import { readFileContent } from "../../../ffi";

type UseFileProps = {
  file: File;
  initialContent: string;
  workspacePath: string;
  workspaceConfig: WorkspaceConfig;
};

export const useFile = ({
  initialContent,
  file,
  workspacePath,
  workspaceConfig,
}: UseFileProps) => {
  const [fileWithContent, dispatch] = useReducer(reducer, {
    ...file,
    content: initialContent,
  });

  const readFromPath = useCallback(
    async (targetId: string, file: File) => {
      const { path } = pathToDir(targetId, workspaceConfig.tree, workspacePath);
      const content = await readFileContent<string>({
        file,
        path,
      });

      if (!content) {
        //@todo: handle error and show toast message
        return;
      }

      dispatch({ type: "save", args: { content } });
    },
    [workspaceConfig.tree, workspacePath],
  );

  return {
    fileWithContent,
    readFromPath,
  };
};
