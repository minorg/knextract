import { Claim, Identifier } from "@/lib/models";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { Either } from "purify-ts";

export async function claim(
  this: SparqlModelSet,
  identifier: Identifier,
): Promise<Either<Error, Claim>> {
  return this.modelByIdentifier({
    identifier,
    modelFactory: {
      fromRdf: Claim.fromRdf,
      sparqlConstructQueryString: Claim.sparqlConstructQueryString,
    },
  });
}
