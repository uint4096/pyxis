import type { Entity, FileEntity } from "../../../types";

export const isFile = (entity: Entity): entity is FileEntity =>
  !!(<FileEntity>entity).File;
