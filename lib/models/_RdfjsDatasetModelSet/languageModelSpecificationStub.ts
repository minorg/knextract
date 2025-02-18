import { Identifier, LanguageModelSpecificationStub } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { Either } from "purify-ts";

export async function languageModelSpecificationStub(
  this: RdfjsDatasetModelSet,
  identifier: Identifier,
): Promise<Either<Error, LanguageModelSpecificationStub>> {
  return this.languageModelSpecificationStubSync(identifier);
}

export function languageModelSpecificationStubSync(
  this: RdfjsDatasetModelSet,
  identifier: Identifier,
): Either<Error, LanguageModelSpecificationStub> {
  return LanguageModelSpecificationStub.fromRdf({
    resource: this.resourceSet.namedResource(identifier),
    languageIn: this.languageIn,
  });
}
