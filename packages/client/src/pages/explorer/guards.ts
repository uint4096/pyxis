import type { Entity, File } from "./types";

export const isFile = (entity: Entity): entity is File => !!(<File>entity).File;
