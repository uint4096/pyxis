import { Account } from "./account";
import { Workspaces } from "./workspace-selection";
import { Options } from "./wrappers";

export const ConfigurationTray = () => {
  return (
    <Options>
      <Account />
      <Workspaces />
      <></>
    </Options>
  );
};
