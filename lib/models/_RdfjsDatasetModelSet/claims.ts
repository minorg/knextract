import { Claim, ClaimQuery, sortModelsByIdentifier } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { rdf } from "@tpluscode/rdf-ns-builders";
import { Either } from "purify-ts";

export async function claims(
  this: RdfjsDatasetModelSet,
  parameters: {
    query: ClaimQuery;
  },
): Promise<Either<Error, readonly Claim[]>> {
  return Either.of(this.claimsSync(parameters));
}

export function claimsSync(
  this: RdfjsDatasetModelSet,
  {
    query,
  }: {
    query: ClaimQuery;
  },
): readonly Claim[] {
  switch (query.type) {
    case "All":
      return sortModelsByIdentifier([
        ...this.resourceSet
          .namedInstancesOf(Claim.fromRdfType)
          .flatMap((resource) =>
            Claim.fromRdf({
              ignoreRdfType: true,
              languageIn: this.languageIn,
              resource,
            })
              .toMaybe()
              .toList(),
          ),
      ]);
    case "Document": {
      let claims = this.resourceSet
        .resource(query.documentIdentifier)
        .valuesOf(rdf.subject)
        .flatMap((value) => value.toNamedResource().toMaybe().toList())
        .flatMap((resource) =>
          Claim.fromRdf({
            ignoreRdfType: true,
            languageIn: this.languageIn,
            resource,
          })
            .toMaybe()
            .toList(),
        );
      if (typeof query.gold !== "undefined") {
        claims = claims.filter((claim) => claim.gold === query.gold);
      }
      return sortModelsByIdentifier(claims);
    }
  }
}
