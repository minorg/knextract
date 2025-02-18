import { CorpusStub, Identifier } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { Either } from "purify-ts";

export async function corpusStub(
  this: RdfjsDatasetModelSet,
  identifier: Identifier,
): Promise<Either<Error, CorpusStub>> {
  return this.corpusStubSync(identifier);
}

export function corpusStubSync(
  this: RdfjsDatasetModelSet,
  identifier: Identifier,
): Either<Error, CorpusStub> {
  return CorpusStub.fromRdf({
    resource: this.resourceSet.namedResource(identifier),
    languageIn: this.languageIn,
  });
}
