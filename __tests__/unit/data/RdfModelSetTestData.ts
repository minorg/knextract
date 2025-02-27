import { Project } from "@/lib/Project";
import {
  Claim,
  Concept,
  ConceptScheme,
  ConceptSchemeStub,
  ConceptStub,
  Corpus,
  CorpusStub,
  Document,
  DocumentStub,
  LanguageModelSpecification,
} from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { datasetCoreFactory } from "@/lib/rdfEnvironment";
import invariant from "ts-invariant";
import { assert } from "vitest";

export interface RdfModelSetTestData {
  readonly claim: Claim;
  readonly claims: readonly Claim[];
  readonly concept: Concept;
  readonly conceptScheme: ConceptScheme;
  readonly conceptSchemeStub: ConceptSchemeStub;
  readonly conceptStub: ConceptStub;
  readonly corpus: Corpus;
  readonly corpusStub: CorpusStub;
  readonly document: Document;
  readonly documentStub: DocumentStub;
  readonly languageModelSpecification: LanguageModelSpecification;
  readonly modelSet: RdfjsDatasetModelSet;
}

export namespace RdfModelSetTestData {
  export async function fromProject(
    project: Project,
  ): Promise<RdfModelSetTestData> {
    const dataset = datasetCoreFactory.dataset();
    for await (const projectDataset of project.datasets()) {
      for (const quad of projectDataset) {
        dataset.add(quad);
      }
    }
    const modelSet = new RdfjsDatasetModelSet({
      dataset,
    });

    const languageModelSpecifications =
      modelSet.languageModelSpecificationsSync();
    invariant(languageModelSpecifications.length > 0);

    for (const documentStub of modelSet.documentStubsSync({
      limit: null,
      offset: 0,
      query: { includeDeleted: true, type: "All" },
    })) {
      const document = modelSet
        .documentSync(documentStub.identifier)
        .unsafeCoerce();

      const claims = modelSet.claimsSync({
        query: {
          documentIdentifier: documentStub.identifier,
          type: "Document",
        },
      });

      for (const claim of claims) {
        if (claim.object.type !== "CategoricalValue") {
          continue;
        }
        const conceptStub = claim.object.value;
        const conceptEither = modelSet.conceptSync(conceptStub.identifier);
        if (conceptEither.isLeft()) {
          continue;
        }
        const concept = conceptEither.unsafeCoerce();

        const conceptSchemeStubs = modelSet.conceptSchemeStubsSync({
          limit: null,
          offset: 0,
          query: {
            conceptIdentifier: concept.identifier,
            type: "HasTopConcept",
          },
        });
        if (conceptSchemeStubs.length === 0) {
          // The MeSH concept scheme isn't asserted in the test data. Continue until we get a claim on a Medline Plus Health Topics concept.
          continue;
        }
        const conceptSchemeStub = conceptSchemeStubs.at(0)!;
        const conceptScheme = modelSet
          .conceptSchemeSync(conceptSchemeStub.identifier)
          .unsafeCoerce();

        const corpusStub = document.memberOfCorpus;
        const corpus = modelSet
          .corpusSync(corpusStub.identifier)
          .unsafeCoerce();

        return {
          claim,
          claims,
          concept,
          conceptScheme,
          conceptSchemeStub,
          conceptStub,
          corpus,
          corpusStub,
          document,
          documentStub,
          languageModelSpecification: languageModelSpecifications[0],
          modelSet,
        };
      }
    }
    assert.fail("unable to find qualified models in model set");
  }
}
