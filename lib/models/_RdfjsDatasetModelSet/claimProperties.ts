import { Claim, ClaimProperty, sortModelsByIdentifier } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import TermMap from "@rdfjs/term-map";
import { NamedNode } from "@rdfjs/types";
import { rdf } from "@tpluscode/rdf-ns-builders";
import { Either } from "purify-ts";

export async function claimProperties(
  this: RdfjsDatasetModelSet,
): Promise<Either<Error, readonly ClaimProperty[]>> {
  return Either.of(this.claimPropertiesSync());
}

export function claimPropertiesSync(
  this: RdfjsDatasetModelSet,
): readonly ClaimProperty[] {
  const claimPropertiesByIdentifier = new TermMap<NamedNode, ClaimProperty>();

  // First trawl for declared properties
  for (const claimPropertyResource of this.resourceSet.namedInstancesOf(
    ClaimProperty.fromRdfType,
  )) {
    ClaimProperty.fromRdf({
      ignoreRdfType: true,
      resource: claimPropertyResource,
    }).ifRight((claimProperty) => {
      claimPropertiesByIdentifier.set(claimProperty.identifier, claimProperty);
    });
  }

  // Then trawl for implicit claim properties -- the predicates of claims.
  for (const claimResource of this.resourceSet.instancesOf(Claim.fromRdfType)) {
    claimResource
      .value(rdf.predicate)
      .chain((value) => value.toIri())
      .ifRight((predicate) => {
        if (claimPropertiesByIdentifier.has(predicate)) {
          return;
        }
        // If the property is used in a claim then it's a claim property, even if it's not explicitly defined elsewhere.
        // We picked up explicitly-defined properties above.
        claimPropertiesByIdentifier.set(
          predicate,
          new ClaimProperty({ identifier: predicate }),
        );
      });
  }

  return sortModelsByIdentifier([...claimPropertiesByIdentifier.values()]);
}
