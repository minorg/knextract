import { DocumentStub, Identifier } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { Either } from "purify-ts";

export async function documentStub(
  this: RdfjsDatasetModelSet,
  identifier: Identifier,
): Promise<Either<Error, DocumentStub>> {
  return this.documentStubSync(identifier);
}

export function documentStubSync(
  this: RdfjsDatasetModelSet,
  identifier: Identifier,
): Either<Error, DocumentStub> {
  return DocumentStub.fromRdf({
    resource: this.resourceSet.namedResource(identifier),
    languageIn: this.languageIn,
  });
}
