import { DocumentQuery, DocumentStub } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { documentResourcesSync } from "@/lib/models/_RdfjsDatasetModelSet/documentResources";
import { Either } from "purify-ts";

export async function documentsCount(
  this: RdfjsDatasetModelSet,
  query: DocumentQuery,
): Promise<Either<Error, number>> {
  return Either.of(this.documentsCountSync(query));
}

export function documentsCountSync(
  this: RdfjsDatasetModelSet,
  query: DocumentQuery,
): number {
  let count = 0;
  for (const documentResource of documentResourcesSync.bind(this)(query)) {
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
    count++;
  }

  return count;
}
