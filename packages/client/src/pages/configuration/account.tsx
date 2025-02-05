import { useState } from "react";
import { FaUser } from "react-icons/fa";
import { Option } from "./wrappers";
import { AccountForm, UserDetails } from "./modals";
import { useConfig } from "../../store";

export const Account = () => {
  const [showDialog, setDialog] = useState(false);
  const { config } = useConfig();

  return (
    <>
      {showDialog && !config.username && (
        <AccountForm onDone={() => setDialog(false)} />
      )}
      {showDialog && config.username && (
        <UserDetails onDone={() => setDialog(false)} config={config} />
      )}
      <Option icon={<FaUser size={18} />} onClick={() => setDialog(true)} />
    </>
  );
};
