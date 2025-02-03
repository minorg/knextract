import {
  DocumentQuery,
  DocumentStub,
  sortModelsByIdentifier,
} from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { documentResourcesSync } from "@/lib/models/_RdfjsDatasetModelSet/documentResources";
import { Either } from "purify-ts";

export async function documentStubs(
  this: RdfjsDatasetModelSet,
  parameters: {
    limit: number | null;
    offset: number;
    query: DocumentQuery;
  },
): Promise<Either<Error, readonly DocumentStub[]>> {
  return Either.of(this.documentStubsSync(parameters));
}

export function documentStubsSync(
  this: RdfjsDatasetModelSet,
  {
    limit,
    offset,
    query,
  }: {
    limit: number | null;
    offset: number;
    query: DocumentQuery;
  },
): readonly DocumentStub[] {
  if (limit === 0) {
    return [];
  }

  let documentStubIndex = 0;
  const documentStubs: DocumentStub[] = [];
  for (const documentResource of sortModelsByIdentifier([
    ...documentResourcesSync.bind(this)(query),
  ])) {
    const documentStubEither = DocumentStub.fromRdf({
      ignoreRdfType: true,
      languageIn: this.languageIn,
      resource: documentResource,
    });
    if (documentStubEither.isLeft()) {
      continue;
    }
    const documentStub = documentStubEither.unsafeCoerce();
    switch (query.type) {
      case "All":
      case "MemberOfCorpus":
        if (!query.includeDeleted && documentStub.deleted) {
          continue;
        }
        break;
    }

    if (documentStubIndex++ >= offset) {
      documentStubs.push(documentStub);
      if (limit !== null && documentStubs.length === limit) {
        return documentStubs;
      }
    }
  }

  return documentStubs;
}
