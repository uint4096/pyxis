import { styled } from "@linaria/react";
import { useCallback, useState } from "react";
import { DirSelection } from "../../../components/input";
import { Modal } from "../../../components/modal";
import { FormWrapper } from "./common";
import { useSystem } from "../../../store/useSystem";

type StoreFormProps = {
  setVisibility: React.Dispatch<React.SetStateAction<boolean>>;
};

export const StoreForm = ({ setVisibility }: StoreFormProps) => {
  const [selectedPath, setSelectedPath] = useState("");
  const { saveToDisk: saveSystemConfig } = useSystem();

  const onSave = useCallback(async () => {
    const systemConfig = { store: selectedPath };
    await saveSystemConfig(systemConfig);

    setVisibility(false);
  }, [saveSystemConfig, selectedPath, setVisibility]);

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
    <FormWrapper>
      <FormContainer>
        <Modal body={body} size="small" footer={footer} />
      </FormContainer>
    </FormWrapper>
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
