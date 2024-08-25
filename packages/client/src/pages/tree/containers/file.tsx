import { useWorkspace } from "../../../store/use-workspace";
import { useTreeStore } from "../../../store/use-tree";
import type { File } from "../../../ffi/files";
import { getOverflowMenu, type MenuOption } from "../../../components";
import { useCallback, useRef } from "react";
import { noop } from "../../../utils";
import { useOutsideEvent } from "../../../hooks";
import {
  flexDisplay,
  NameContainer,
  noDisplay,
  OptionsContainer,
} from "./styles";
import { styled } from "@linaria/react";

type FileContainerProps = {
  file: Partial<File>;
  setOverflowPopup: React.Dispatch<React.SetStateAction<string | undefined>>;
  overflowPopup: string | undefined;
};

export const FileContainer = ({
  file,
  setOverflowPopup,
  overflowPopup,
}: FileContainerProps) => {
  const { currentWorkspace } = useWorkspace();
  const { deleteFile } = useTreeStore();
  const optionsRef = useRef<HTMLDivElement>(null);

  useOutsideEvent(optionsRef, () => {
    setOverflowPopup("");
  });

  if (!currentWorkspace || !file?.title) {
    return <></>;
  }

  const FileOverflow = getOverflowMenu();

  const fileMenuOptions: Array<MenuOption> = [
    {
      handler: async () => {},
      id: "rename",
      name: "Rename",
    },
    {
      handler: useCallback(async () => {
        // if (selectedFile.path === file.path) {
        //   unselect();
        // }

        deleteFile(file as File);
      }, [deleteFile, file]),
      id: "delete",
      name: "Delete",
    },
  ];

  return (
    <NameContainer
      onClick={() => {
        // (unselect(), select(file as File), readFromDisk(workspacePath))
      }}
    >
      <FileName>{file.title}</FileName>
      <OptionsContainer
        className={overflowPopup === file.id ? flexDisplay : noDisplay}
      >
        <FileOverflow
          options={fileMenuOptions}
          onClick={() => setOverflowPopup(file.uid)}
          showMenu={file.uid === overflowPopup}
          onKeyDown={(e) =>
            e.key === "Escape" ? setOverflowPopup("") : noop()
          }
          ref={optionsRef}
        />
      </OptionsContainer>
    </NameContainer>
  );
};

const FileName = styled.div`
  padding: 0.2vh 0vw;
  margin-left: 1vw;
  opacity: 0.5;
  &:hover {
    background-color: #080808;
  }
`;
