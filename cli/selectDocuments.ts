import {
  Document,
  DocumentQuery,
  DocumentStub,
  Identifier,
  ModelSet,
} from "@/lib/models";

export async function* selectDocuments({
  identifiers,
  corpusIdentifier,
  limit,
  modelSet,
  offset,
}: {
  corpusIdentifier: Identifier | null;
  identifiers: readonly Identifier[];
  limit: number | null;
  modelSet: ModelSet;
  offset: number;
}): AsyncIterable<DocumentStub> {
  let documentsQuery: DocumentQuery;
  if (identifiers.length > 0) {
    documentsQuery = {
      documentIdentifiers: identifiers,
      type: "Identifiers",
    };
  } else if (corpusIdentifier) {
    documentsQuery = {
      includeDeleted: false,
      corpusIdentifier: corpusIdentifier,
      type: "MemberOfCorpus",
    };
  } else {
    documentsQuery = {
      includeDeleted: false,
      type: "All",
    };
  }

  // TODO: paginate if the limit is too high
  for (const document of (
    await modelSet.documentStubs({
      limit: limit,
      offset: offset,
      query: documentsQuery,
    })
  ).orDefault([])) {
    yield document;
  }
}
