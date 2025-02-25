import { testData } from "@/__tests__/unit/data";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { describe, it } from "vitest";
import { behavesLikeModelSet } from "./behavesLikeModelSet";

describe("RdfjsDatasetModelSet", async () => {
  const immutableModelSet = testData.medlinePlus.modelSet;

  await behavesLikeModelSet({
    immutableModelSet: immutableModelSet,
    withEmptyMutableModelSet: (use) => use(new RdfjsDatasetModelSet()),
  });

  it("clone", ({ expect }) => {
    expect(immutableModelSet.cloneSync().dataset.size).toStrictEqual(
      immutableModelSet.dataset.size,
    );
  });
});
