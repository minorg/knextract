import {
  ConceptSelector,
  ConceptStub,
  Identifier,
  KosSemanticRelationProperty,
  ModelSet,
} from "@/lib/models";
import TermSet from "@rdfjs/term-set";
import { Either, EitherAsync } from "purify-ts";

async function* narrowerTransitiveConcepts({
  focusConceptStub,
  modelSet,
  yieldedConceptIdentifiers,
}: {
  focusConceptStub: ConceptStub;
  modelSet: ModelSet;
  yieldedConceptIdentifiers: TermSet<Identifier>;
}): AsyncGenerator<ConceptStub> {
  for (const narrowerConceptStub of (
    await modelSet.conceptStubs({
      limit: null,
      offset: 0,
      query: {
        inverseSemanticRelationProperties: true,
        semanticRelationProperties: [
          KosSemanticRelationProperty.NARROWER,
          KosSemanticRelationProperty.NARROWER_TRANSITIVE,
        ],
        subjectConceptIdentifier: focusConceptStub.identifier,
        type: "ObjectsOfSemanticRelations",
      },
    })
  ).orDefault([])) {
    if (yieldedConceptIdentifiers.has(narrowerConceptStub.identifier)) {
      continue;
    }

    yield narrowerConceptStub;
    yieldedConceptIdentifiers.add(narrowerConceptStub.identifier);

    yield* narrowerTransitiveConcepts({
      focusConceptStub: narrowerConceptStub,
      modelSet,
      yieldedConceptIdentifiers,
    });
  }
}

export async function selectConcepts({
  conceptSelector,
  modelSet,
}: {
  conceptSelector: ConceptSelector;
  modelSet: ModelSet;
}): Promise<Either<Error, readonly ConceptStub[]>> {
  return EitherAsync(async ({ liftEither }) => {
    switch (conceptSelector.type) {
      case "ConceptSchemeConceptSelector":
        return liftEither(
          await modelSet.conceptStubs({
            limit: null,
            offset: 0,
            query: {
              conceptSchemeIdentifier: conceptSelector.conceptScheme.identifier,
              type: "InScheme",
            },
          }),
        );
      case "ConceptSchemeTopConceptSelector":
        return liftEither(
          await modelSet.conceptStubs({
            limit: null,
            offset: 0,
            query: {
              conceptSchemeIdentifier: conceptSelector.conceptScheme.identifier,
              type: "TopConceptOf",
            },
          }),
        );
      case "EnumeratedConceptSelector":
        return conceptSelector.concepts;
      case "NarrowerConceptSelector":
        return liftEither(
          await modelSet.conceptStubs({
            limit: null,
            offset: 0,
            query: {
              inverseSemanticRelationProperties: true,
              semanticRelationProperties: [
                KosSemanticRelationProperty.NARROWER,
              ],
              subjectConceptIdentifier: conceptSelector.focusConcept.identifier,
              type: "ObjectsOfSemanticRelations",
            },
          }),
        );
      case "NarrowerTransitiveConceptSelector": {
        const conceptStubs: ConceptStub[] = [];
        for await (const conceptStub of narrowerTransitiveConcepts({
          focusConceptStub: conceptSelector.focusConcept,
          modelSet,
          yieldedConceptIdentifiers: new TermSet(),
        })) {
          conceptStubs.push(conceptStub);
        }
        return conceptStubs;
      }
    }
  });
}
