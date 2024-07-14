import type { Directory, File } from "../types";
import { isFileEntity } from "./guards";

export const isFileInDir = (file: File, dir: Directory): boolean =>
  dir.content.some((e) => (isFileEntity(e) ? true : isFileInDir(file, e.Dir)));
