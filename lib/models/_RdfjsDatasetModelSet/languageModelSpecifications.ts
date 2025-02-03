import {
  LanguageModelSpecification,
  sortModelsByIdentifier,
} from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { Either } from "purify-ts";

export async function languageModelSpecifications(
  this: RdfjsDatasetModelSet,
): Promise<Either<Error, readonly LanguageModelSpecification[]>> {
  return Either.of(this.languageModelSpecificationsSync());
}

export function languageModelSpecificationsSync(
  this: RdfjsDatasetModelSet,
): readonly LanguageModelSpecification[] {
  return sortModelsByIdentifier([
    ...this.resourceSet
      .namedInstancesOf(LanguageModelSpecification.fromRdfType)
      .flatMap((resource) =>
        LanguageModelSpecification.fromRdf({
          ignoreRdfType: true,
          languageIn: this.languageIn,
          resource,
        })
          .toMaybe()
          .toList(),
      ),
  ]);
}
