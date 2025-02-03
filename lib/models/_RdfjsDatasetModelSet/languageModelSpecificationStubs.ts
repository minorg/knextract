import {
  LanguageModelSpecification,
  LanguageModelSpecificationStub,
  sortModelsByIdentifier,
} from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { Either } from "purify-ts";

export async function languageModelSpecificationStubs(
  this: RdfjsDatasetModelSet,
): Promise<Either<Error, readonly LanguageModelSpecificationStub[]>> {
  return Either.of(this.languageModelSpecificationStubsSync());
}

export function languageModelSpecificationStubsSync(
  this: RdfjsDatasetModelSet,
): readonly LanguageModelSpecificationStub[] {
  return sortModelsByIdentifier([
    ...this.resourceSet
      .namedInstancesOf(LanguageModelSpecification.fromRdfType)
      .flatMap((resource) =>
        LanguageModelSpecificationStub.fromRdf({
          ignoreRdfType: true,
          languageIn: this.languageIn,
          resource,
        })
          .toMaybe()
          .toList(),
      ),
  ]);
}
