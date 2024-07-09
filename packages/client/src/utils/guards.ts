import type { File, Directory, Entity, FileEntity } from "../types";

export const isFileEntity = (entity: Entity): entity is FileEntity =>
  !!(<FileEntity>entity).File;

export const isFile = (document: File | Directory): document is File =>
  !Array.isArray((<Directory>document).content);
