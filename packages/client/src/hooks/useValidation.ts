import { useEffect, useState } from "react";

export const useValidation = (state: string) => {
  const [validationFailed, setValidationFailed] = useState(false);

  useEffect(() => {
    setValidationFailed(false);
  }, [state]);

  return {
    validationFailed,
    failValidation: () => setValidationFailed(true),
  };
};
