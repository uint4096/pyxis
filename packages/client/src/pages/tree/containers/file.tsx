import { styled } from "@linaria/react";
import { useCallback, useRef } from "react";

import { useWorkspace, useTreeStore } from "../../../store";
import type { File } from "../../../ffi";
import { getOverflowMenu, type MenuOption } from "../../../components";
import { noop } from "../../../utils";
import { useOutsideEvent } from "../../../hooks";
import {
  backgroundHover,
  flexDisplay,
  NameContainer,
  noDisplay,
  OptionsContainer,
} from "./styles";
import type { Document } from "../../../types";

type FileContainerProps = {
  file: Partial<File>;
  setOverflowPopup: React.Dispatch<React.SetStateAction<string | undefined>>;
  overflowPopup: string | undefined;
  initDocRename: (type: Document, uid: string, name: string) => void;
};

export const FileContainer = ({
  file,
  setOverflowPopup,
  overflowPopup,
  initDocRename,
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
      handler: () => initDocRename("file", file?.uid ?? "", file?.title ?? ""),
      id: "rename",
      name: "Rename",
    },
    {
      handler: useCallback(async () => {
        if (selectedFile?.uid === file.uid) {
          selectFile(undefined);
        }

        deleteFile(file as File);
      }, [deleteFile, file, selectFile, selectedFile?.uid]),
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
      className={
        overflowPopup === file.uid || selectedFile?.uid === file.uid
          ? backgroundHover
          : ""
      }
    >
      <FileName>{file.title}</FileName>
      <OptionsContainer
        className={overflowPopup === file.uid ? flexDisplay : noDisplay}
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
  color: #e8e8e8;
`;
