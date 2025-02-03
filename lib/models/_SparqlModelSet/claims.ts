import { Claim, ClaimQuery } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { dataFactory, datasetCoreFactory } from "@/lib/rdfEnvironment";
import { sparqlRdfTypePattern } from "@kos-kit/models/sparqlRdfTypePattern";
import { rdf } from "@tpluscode/rdf-ns-builders";
import { Either, EitherAsync } from "purify-ts";
import * as sparqljs from "sparqljs";

const claimVariable = dataFactory.variable!("claim");

function claimQueryToWherePatterns(
  query: ClaimQuery,
): readonly sparqljs.Pattern[] {
  const patterns: sparqljs.Pattern[] = [
    sparqlRdfTypePattern({
      rdfType: Claim.fromRdfType,
      subject: claimVariable,
    }),
  ];

  switch (query.type) {
    case "All":
      return patterns;
    case "Document": {
      patterns.push({
        triples: [
          {
            object: query.documentIdentifier,
            predicate: rdf.subject,
            subject: claimVariable,
          },
        ],
        type: "bgp",
      });
      return patterns;
    }
  }
}

export async function claims(
  this: SparqlModelSet,
  {
    query,
  }: {
    query: ClaimQuery;
  },
): Promise<Either<Error, readonly Claim[]>> {
  return EitherAsync(async () =>
    new RdfjsDatasetModelSet({
      dataset: datasetCoreFactory.dataset(
        (
          await this.sparqlQueryClient.queryQuads(
            Claim.sparqlConstructQueryString({
              subject: claimVariable,
              variablePrefix: "claim",
              where: claimQueryToWherePatterns(query).concat(),
            }),
          )
        ).concat(),
      ),
      languageIn: this.languageIn,
    }).claimsSync({
      query: { type: "All" },
    }),
  );
}
