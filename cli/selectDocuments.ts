import {
  DocumentQuery,
  DocumentStub,
  Identifier,
  ModelSet,
} from "@/lib/models";
import { Either, EitherAsync } from "purify-ts";

async function* queryDocuments({
  limit,
  offset,
  modelSet,
  query,
}: {
  limit: number | null;
  offset: number;
  modelSet: ModelSet;
  query: DocumentQuery;
}): AsyncIterable<DocumentStub> {
  // TODO: paginate if the limit is too high
  for (const document of (
    await modelSet.documentStubs({
      limit: limit,
      offset: offset,
      query,
    })
  ).unsafeCoerce()) {
    yield document;
  }
}

export async function selectDocuments({
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
}): Promise<
  Either<
    Error,
    { documents: AsyncIterable<DocumentStub>; documentsCount: number }
  >
> {
  let query: DocumentQuery;
  if (identifiers.length > 0) {
    query = {
      documentIdentifiers: identifiers,
      type: "Identifiers",
    };
  } else if (corpusIdentifier) {
    query = {
      includeDeleted: false,
      corpusIdentifier: corpusIdentifier,
      type: "MemberOfCorpus",
    };
  } else {
    query = {
      includeDeleted: false,
      type: "All",
    };
  }

  return EitherAsync(async ({ liftEither }) => {
    const documentsCount = await liftEither(
      await modelSet.documentsCount(query),
    );

    return {
      documents: queryDocuments({ limit, offset, modelSet, query }),
      documentsCount,
    };
  });
}
