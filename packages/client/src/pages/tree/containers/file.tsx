import { styled } from "@linaria/react";
import { useFile, useWorkspace } from "../../../store";
import type { File } from "../../../types";
import { getOverflowMenu, type MenuOption } from "../../../components";
import { useCallback, useRef } from "react";
import { noop } from "../../../utils";
import { useOutsideEvent } from "../../../hooks";

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
  const { select, readFromDisk } = useFile();

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
      handler: useCallback(
        async () => void removeEntity(file as File),
        [file, removeEntity],
      ),
      id: "delete",
      name: "Delete",
    },
  ];

  return (
    <NameContainer
      onClick={() => (select(file as File), readFromDisk(workspacePath))}
    >
      <FileName>{file.name}</FileName>
      <OptionsContainer>
        <FileOverflow
          options={fileMenuOptions}
          onClick={() => setOverflowPopup(`${dirId}/${file.name}`)}
          showMenu={`${dirId}/${file.name}` === overflowPopup}
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

const OptionsContainer = styled.div`
  height: 100%;
  align-items: center;
  gap: 0.5vw;
`;

const NameContainer = styled.div`
  padding: 0.2vh 0.3vw;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  gap: 0.1vw;
  border-radius: 5px;
  opacity: 0.9;

  &:hover {
    background-color: #080808;
  }

  &:hover ${FileName} {
    opacity: 0.9;
  }
`;
