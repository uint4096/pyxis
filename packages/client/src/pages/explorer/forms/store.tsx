import { styled } from "@linaria/react";
import { useCallback, useState } from "react";
import { DirSelection } from "../../../components/input";
import { Modal } from "../../../components/modal";
import { save_config } from "../../../ffi";
import { SystemConfig } from "../types";

type StoreFormProps = {
  setVisibility: React.Dispatch<React.SetStateAction<boolean>>;
};

export const StoreForm = ({ setVisibility }: StoreFormProps) => {
  const [selectedPath, setSelectedPath] = useState("");
  const onSave = useCallback(async () => {
    await save_config<SystemConfig, "write_system_config">(
      "write_system_config",
      { config: { store: selectedPath } }
    );

    setVisibility(false);
  }, [selectedPath]);

  const body = (
    <div>
      <DirSelection
        value={selectedPath}
        placeholder="Path to workspaces..."
        size="medium"
        onChange={setSelectedPath}
        message="Select a directory to store your workspaces"
      />
    </div>
  );

  const footer = (
    <FormFooter>
      <button onClick={onSave}>Save</button>
    </FormFooter>
  );

  return (
    <FormContainer>
      <Modal body={body} size="small" footer={footer} />
    </FormContainer>
  );
};

const FormContainer = styled.div`
  width: 20vw;
  height: 10vw;
  position: fixed;
`;

const FormFooter = styled.div`
  display: flex;
  justify-content: flex-end;
`;
