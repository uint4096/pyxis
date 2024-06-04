import type { File } from "../../../../types";

export type Actions = "save" | "set-metadata";

type ActionWithArgs = {
  save: { content: string };
  "set-metadata": { metadata: Omit<File, "hidden" | "name"> };
};

type FileWithContent = File & { content: string };

type Args<T extends Actions> = ActionWithArgs[T];

export const reducer = <T extends Actions>(
  state: FileWithContent,
  action: { type: T; args: Args<T> },
) => {
  const { type, args } = action;

  switch (type) {
    case "save": {
      return {
        ...state,
        content: (<ActionWithArgs["save"]>args).content,
      };
    }
    case "set-metadata": {
      const metadata = (<ActionWithArgs["set-metadata"]>args).metadata;
      return {
        ...state,
        ...metadata,
      };
    }
    default: {
      throw new Error("Unknown Action");
    }
  }
};
