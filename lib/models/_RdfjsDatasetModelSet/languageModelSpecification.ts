import { Identifier, LanguageModelSpecification } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { Either } from "purify-ts";

export async function languageModelSpecification(
  this: RdfjsDatasetModelSet,
  identifier: Identifier,
): Promise<Either<Error, LanguageModelSpecification>> {
  return this.languageModelSpecificationSync(identifier);
}

export function languageModelSpecificationSync(
  this: RdfjsDatasetModelSet,
  identifier: Identifier,
): Either<Error, LanguageModelSpecification> {
  return LanguageModelSpecification.fromRdf({
    resource: this.resourceSet.namedResource(identifier),
    languageIn: this.languageIn,
  });
}
