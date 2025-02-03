import { testData } from "@/__tests__/unit/data";
import { rdf } from "@/lib/models/impl";
import { describe, it } from "vitest";
import { behavesLikeModelSet } from "./behavesLikeModelSet";

describe("RdfjsDatasetModelSet", async () => {
  const immutableModelSet = testData.medlinePlus.modelSet;

  await behavesLikeModelSet({
    immutableModelSet: immutableModelSet,
    withEmptyMutableModelSet: (use) => use(new rdf.mem.ModelSet()),
  });

  it("clone", ({ expect }) => {
    expect(immutableModelSet.cloneSync().dataset.size).toStrictEqual(
      immutableModelSet.dataset.size,
    );
  });
});
