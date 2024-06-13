import { Args, invoke } from "./invoke";

type Commands = Extract<keyof Args<never>, "watch_workspace">;

const watchFile =
  <T extends Commands>(command: T) =>
  async (args: Args<never>[T]): Promise<boolean> => {
    try {
      await invoke(command, args);

      return true;
    } catch (e) {
      console.error(
        `[Config Error] Error while invoking watcher on ${args.path ?? "file"}!`,
        e,
      );

      return false;
    }
  };

export const watchWorkspace = watchFile("watch_workspace");
