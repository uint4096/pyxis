import { styled } from "@linaria/react";
import { useCallback, useRef } from "react";

import { useWorkspace, useTreeStore } from "../../../store";
import type { File } from "../../../ffi";
import { getOverflowMenu, type MenuOption } from "../../../components";
import { noop, toast } from "../../../utils";
import { useOutsideEvent } from "../../../hooks";
import { CiFileOn } from "react-icons/ci";
import {
  backgroundHover,
  flexDisplay,
  NameContainer,
  noDisplay,
  OptionsContainer,
} from "./styles";
import type { Document } from "../../../types";
import { css } from "@linaria/core";

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

        try {
          await deleteFile(file as File);
        } catch {
          toast("Failed to delete file!");
        }
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
      <NameWithIcon>
        <CiFileOn className={verticallyMiddle} size={15} />
        <FileName>{file.title}</FileName>
      </NameWithIcon>
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

const verticallyMiddle = css`
  align-self: center;
`;

const NameWithIcon = styled.div`
  display: flex;
  gap: 0.2em;
  padding: 0.2vh 0.3vw;
`;

const FileName = styled.div`
  color: #e8e8e8;
`;
