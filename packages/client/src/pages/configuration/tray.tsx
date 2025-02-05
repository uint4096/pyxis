import { Account } from "./account";
import { Workspaces } from "./workspace-selection";
import { Options } from "./wrappers";
import { Option } from "./wrappers";
import { BsBoxArrowRight } from "react-icons/bs";

type TrayProps = {
  setExplorerVisibility: React.Dispatch<React.SetStateAction<boolean>>;
  explorerVisibility: boolean;
};

export const ConfigurationTray = ({
  explorerVisibility,
  setExplorerVisibility,
}: TrayProps) => {
  return (
    <Options>
      <Workspaces />
      <Account />
      {!explorerVisibility && (
        <Option
          icon={<BsBoxArrowRight size={20} />}
          onClick={() => setExplorerVisibility(true)}
        />
      )}
    </Options>
  );
};
