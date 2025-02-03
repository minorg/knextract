import { Document, Identifier } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { Either } from "purify-ts";

export async function document(
  this: RdfjsDatasetModelSet,
  identifier: Identifier,
): Promise<Either<Error, Document>> {
  return this.documentSync(identifier);
}

export function documentSync(
  this: RdfjsDatasetModelSet,
  identifier: Identifier,
): Either<Error, Document> {
  return Document.fromRdf({
    resource: this.resourceSet.namedResource(identifier),
    languageIn: this.languageIn,
  });
}
