import { Claim, Identifier } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { Either } from "purify-ts";

export async function claim(
  this: RdfjsDatasetModelSet,
  identifier: Identifier,
): Promise<Either<Error, Claim>> {
  return this.claimSync(identifier);
}

export function claimSync(
  this: RdfjsDatasetModelSet,
  identifier: Identifier,
): Either<Error, Claim> {
  return Claim.fromRdf({
    resource: this.resourceSet.namedResource(identifier),
    languageIn: this.languageIn,
  });
}
