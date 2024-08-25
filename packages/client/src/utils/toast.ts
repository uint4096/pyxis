import { toast as toastMessage } from "react-toastify";

export const toast = (
  message: string,
  type: "warning" | "error" | "success" = "error",
) => {
  toastMessage(message, { type });
};
