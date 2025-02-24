import { testData } from "@/__tests__/unit/data";
import {
  ConceptSchemeConceptSelector,
  ConceptSchemeTopConceptSelector,
  EnumeratedConceptSelector,
  NarrowerConceptSelector,
  NarrowerTransitiveConceptSelector,
} from "@/lib/models";
import { selectConcepts } from "@/lib/models/selectConcepts";
import { dataFactory } from "@/lib/rdfEnvironment";
import { arrayEquals } from "@kos-kit/models";
import { describe, it } from "vitest";

describe("selectConcepts", () => {
  const modelSet = testData.medlinePlus.modelSet;
  const conceptScheme = modelSet
    .conceptSchemeStubSync(
      dataFactory.namedNode("urn:medline-plus:health-topics:groups"),
    )
    .unsafeCoerce();
  const concept = modelSet
    .conceptStubSync(
      dataFactory.namedNode(
        "https://medlineplus.gov/bloodheartandcirculation.html",
      ),
    )
    .unsafeCoerce();

  [
    {
      conceptSelector: new EnumeratedConceptSelector({
        concepts: [concept],
      }),
      expectedConceptsCount: 1,
      expectedConceptIdentifiers: [concept.identifier],
    },
    {
      conceptSelector: new ConceptSchemeTopConceptSelector({
        conceptScheme,
      }),
      expectedConceptsCount: 44,
    },
    {
      conceptSelector: new ConceptSchemeConceptSelector({
        conceptScheme,
      }),
      expectedConceptsCount: 44,
    },
    {
      conceptSelector: new NarrowerConceptSelector({
        focusConcept: concept,
      }),
      expectedConceptsCount: 0,
    },
    {
      conceptSelector: new NarrowerTransitiveConceptSelector({
        focusConcept: concept,
      }),
      expectedConceptsCount: 0,
    },
  ].forEach(
    ({
      conceptSelector,
      expectedConceptsCount,
      expectedConceptIdentifiers,
    }) => {
      it(`should select ${expectedConceptsCount} concepts from MeSH using a ${conceptSelector.type}`, async ({
        expect,
      }) => {
        const actualConceptIdentifiers = (
          await selectConcepts({ conceptSelector, modelSet })
        )
          .unsafeCoerce()
          .map((_) => _.identifier);

        expect(actualConceptIdentifiers).toHaveLength(expectedConceptsCount);

        if (expectedConceptIdentifiers) {
          expect(
            arrayEquals(
              expectedConceptIdentifiers,
              actualConceptIdentifiers,
              (left, right) => left.equals(right),
            ).extract(),
          ).toStrictEqual(true);
        }
      });
    },
  );
});
