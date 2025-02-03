import * as fs from "node:fs/promises";
import path from "node:path";
import { testData } from "@/__tests__/unit/data";
import { Project } from "@/lib/Project";
import { FsModelSet } from "@/lib/models/FsModelSet";
import * as tmp from "tmp-promise";
import invariant from "ts-invariant";
import { describe } from "vitest";
import { behavesLikeModelSet } from "./behavesLikeModelSet";

describe("FsModelSet", async () => {
  const immutableModelSet = testData.medlinePlus.modelSet;

  await behavesLikeModelSet({
    immutableModelSet: immutableModelSet,
    withEmptyMutableModelSet: async (use) => {
      await tmp.withDir(
        async ({ path: tempProjectDirectoryPath }) => {
          await fs.mkdir(
            path.resolve(tempProjectDirectoryPath, "data", "managed"),
            { recursive: true },
          );
          // await fs.symlink(
          //   testData.project.directoryPaths.data.unmanaged,
          //   path.resolve(tempProjectDirectoryPath, "data", "unmanaged"),
          // );
          const tempProject = new Project({
            env: {},
            rootDirectoryPath: tempProjectDirectoryPath,
          });
          const modelSet = await tempProject.modelSet({ locale: "en" });
          invariant(modelSet instanceof FsModelSet);
          // Clear out any baked-in data
          for (const quad of [...modelSet.dataset]) {
            modelSet.dataset.delete(quad);
          }
          await use(modelSet);
        },
        { unsafeCleanup: true },
      );
    },
  });
});
