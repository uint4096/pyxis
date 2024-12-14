import { useState } from "react";
import { UserSquare } from "../../icons";
import { Option } from "./wrappers";
import { AccountForm } from "./forms";

export const Account = () => {
  const [showDialog, setDialog] = useState(false);

  return (
    <>
      {showDialog && <AccountForm onDone={() => setDialog(false)} />}
      <Option icon={<UserSquare />} onClick={() => setDialog(true)} />
    </>
  );
};
