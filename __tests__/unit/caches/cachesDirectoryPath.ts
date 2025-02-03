import * as path from "node:path";
import { fileURLToPath } from "node:url";

export const cachesDirectoryPath = path.resolve(
  path.join(path.dirname(fileURLToPath(import.meta.url))),
);
