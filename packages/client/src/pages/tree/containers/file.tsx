import { useFile, useWorkspace } from "../../../store";
import type { File } from "../../../types";
import { getOverflowMenu, type MenuOption } from "../../../components";
import { useCallback, useMemo, useRef } from "react";
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
  dirId: string;
  setOverflowPopup: React.Dispatch<React.SetStateAction<string>>;
  overflowPopup: string;
};

export const FileContainer = ({
  file,
  dirId,
  setOverflowPopup,
  overflowPopup,
}: FileContainerProps) => {
  const { path: workspacePath, removeEntity } = useWorkspace();
  const { select, readFromDisk, file: selectedFile, unselect } = useFile();

  const optionsRef = useRef<HTMLDivElement>(null);

  useOutsideEvent(optionsRef, () => {
    setOverflowPopup("");
  });

  if (!workspacePath || !file?.name) {
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
        if (selectedFile.path === file.path) {
          unselect();
        }

        removeEntity(file as File);
      }, [file, removeEntity, selectedFile.path, unselect]),
      id: "delete",
      name: "Delete",
    },
  ];

  const id = useMemo(() => `${dirId}/${file.name}`, [dirId, file.name]);

  return (
    <NameContainer
      onClick={() => (
        unselect(), select(file as File), readFromDisk(workspacePath)
      )}
    >
      <FileName>{file.name}</FileName>
      <OptionsContainer
        className={overflowPopup === id ? flexDisplay : noDisplay}
      >
        <FileOverflow
          options={fileMenuOptions}
          onClick={() => setOverflowPopup(id)}
          showMenu={id === overflowPopup}
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
