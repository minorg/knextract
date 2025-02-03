import { ClaimProperty, sortModelsByIdentifier } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { Either } from "purify-ts";

export async function claimProperties(
  this: RdfjsDatasetModelSet,
): Promise<Either<Error, readonly ClaimProperty[]>> {
  return Either.of(this.claimPropertiesSync());
}

export function claimPropertiesSync(
  this: RdfjsDatasetModelSet,
): readonly ClaimProperty[] {
  return sortModelsByIdentifier([
    ...this.resourceSet
      .namedInstancesOf(ClaimProperty.fromRdfType)
      .flatMap((resource) =>
        ClaimProperty.fromRdf({
          ignoreRdfType: true,
          languageIn: this.languageIn,
          resource,
        })
          .toMaybe()
          .toList(),
      ),
  ]);
}
