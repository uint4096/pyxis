import { styled } from "@linaria/react";
import { useCallback, useRef } from "react";

import { useWorkspace, useTreeStore } from "../../../store";
import type { File } from "../../../ffi";
import { getOverflowMenu, type MenuOption } from "../../../components";
import { noop } from "../../../utils";
import { useOutsideEvent } from "../../../hooks";
import {
  flexDisplay,
  NameContainer,
  noDisplay,
  OptionsContainer,
} from "./styles";

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
  const { selectedFile, deleteFile, selectFile } = useTreeStore();
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
        if (selectedFile?.id === file.id) {
          selectFile(undefined);
        }

        deleteFile(file as File);
      }, [deleteFile, file, selectFile, selectedFile?.id]),
      id: "delete",
      name: "Delete",
    },
  ];

  return (
    <NameContainer
      onClick={() => {
        selectFile(undefined);
        selectFile(file as File);
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
