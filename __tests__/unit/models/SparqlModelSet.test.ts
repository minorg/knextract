import { testData } from "@/__tests__/unit/data";
import { OxigraphModelSet } from "@/lib/models/OxigraphModelSet";
import { describe } from "vitest";
import { behavesLikeModelSet } from "./behavesLikeModelSet";

describe("SparqlModelSet", async () => {
  const immutableModelSet = testData.medlinePlus.modelSet;

  await behavesLikeModelSet({
    immutableModelSet: OxigraphModelSet.clone(immutableModelSet),
    sparql: true,
    withEmptyMutableModelSet: (use) =>
      use(OxigraphModelSet.create({ languageIn: [] })),
  });
});
