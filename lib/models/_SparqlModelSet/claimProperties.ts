import { Claim, ClaimProperty, sortModelsByIdentifier } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { dataFactory, datasetCoreFactory } from "@/lib/rdfEnvironment";
import { mapBindingsToIdentifiers } from "@kos-kit/models";
import { sparqlRdfTypePattern } from "@kos-kit/models/sparqlRdfTypePattern";
import TermMap from "@rdfjs/term-map";
import { NamedNode } from "@rdfjs/types";
import { rdf } from "@tpluscode/rdf-ns-builders";
import { Either, EitherAsync } from "purify-ts";

const claimVariable = dataFactory.variable!("claimVariable");
const claimPropertyVariable = dataFactory.variable!("claimPropertyVariable");

export async function claimProperties(
  this: SparqlModelSet,
): Promise<Either<Error, readonly ClaimProperty[]>> {
  return EitherAsync(async () => {
    const claimPropertiesByIdentifier = new TermMap<NamedNode, ClaimProperty>();

    // First trawl for declared properties
    for (const claimProperty of new RdfjsDatasetModelSet({
      dataset: datasetCoreFactory.dataset(
        (
          await this.sparqlQueryClient.queryQuads(
            ClaimProperty.sparqlConstructQueryString({
              subject: claimPropertyVariable,
              variablePrefix: "claimProperty",
              where: [
                sparqlRdfTypePattern({
                  rdfType: ClaimProperty.fromRdfType,
                  subject: claimPropertyVariable,
                }),
              ],
            }),
          )
        ).concat(),
      ),
      languageIn: this.languageIn,
    }).claimPropertiesSync()) {
      claimPropertiesByIdentifier.set(claimProperty.identifier, claimProperty);
    }

    // Then trawl for implicit claim properties -- the predicates of claims.
    for (const claimPropertyIdentifier of mapBindingsToIdentifiers(
      await this.sparqlQueryClient.queryBindings(
        this.sparqlGenerator.stringify({
          distinct: true,
          prefixes: {},
          queryType: "SELECT",
          type: "query",
          variables: [claimPropertyVariable],
          where: [
            {
              triples: [
                {
                  subject: claimVariable,
                  predicate: rdf.type,
                  object: Claim.fromRdfType,
                },
                {
                  subject: claimVariable,
                  predicate: rdf.predicate,
                  object: claimPropertyVariable,
                },
              ],
              type: "bgp",
            },
          ],
        }),
      ),
      claimPropertyVariable.value,
    )) {
      if (!claimPropertiesByIdentifier.has(claimPropertyIdentifier)) {
        claimPropertiesByIdentifier.set(
          claimPropertyIdentifier,
          new ClaimProperty({ identifier: claimPropertyIdentifier }),
        );
      }
    }

    return sortModelsByIdentifier([...claimPropertiesByIdentifier.values()]);
  });
}
