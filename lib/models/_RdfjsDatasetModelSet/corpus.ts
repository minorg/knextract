import { Corpus, Identifier } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { Either } from "purify-ts";

export async function corpus(
  this: RdfjsDatasetModelSet,
  identifier: Identifier,
): Promise<Either<Error, Corpus>> {
  return this.corpusSync(identifier);
}

export function corpusSync(
  this: RdfjsDatasetModelSet,
  identifier: Identifier,
): Either<Error, Corpus> {
  return Corpus.fromRdf({
    resource: this.resourceSet.namedResource(identifier),
    languageIn: this.languageIn,
  });
}
