import type { File, FileWithContent } from "../../../../types";

export type Actions = "save" | "set-metadata";

type ActionWithArgs = {
  save: { content: string; file: File };
  "set-metadata": { metadata: Omit<File, "hidden" | "name" | "path"> };
};

type Args<T extends Actions> = ActionWithArgs[T];

export const reducer = <T extends Actions>(
  state: Partial<FileWithContent>,
  action: { type: T; args: Args<T> },
) => {
  const { type, args } = action;

  switch (type) {
    case "save": {
      const { content, file } = <ActionWithArgs["save"]>args;
      return {
        ...state,
        ...file,
        content: content,
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
