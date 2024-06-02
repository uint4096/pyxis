import { styled } from "@linaria/react";
import { useCallback, useState } from "react";
import { DirSelection } from "../../../components/input";
import { Modal } from "../../../components/modal";
import { saveSystemConfig } from "../../../ffi";
import { SystemConfig } from "../types";
import { FormWrapper } from "./common";

type StoreFormProps = {
  onCreate: (config: SystemConfig) => void;
};

export const StoreForm = ({ onCreate }: StoreFormProps) => {
  const [selectedPath, setSelectedPath] = useState("");
  const onSave = useCallback(async () => {
    const systemConfig = { store: selectedPath };

    await saveSystemConfig<SystemConfig>({ config: systemConfig });

    onCreate(systemConfig);
  }, [onCreate, selectedPath]);

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
