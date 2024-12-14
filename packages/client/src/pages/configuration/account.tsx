import { UserSquare } from "../../icons";
import { Option } from "./wrappers";

export const Account = () => {
  return (
    <Option
      icon={<UserSquare />}
      onClick={() => console.info("Clicked on user icon")}
    />
  );
};
