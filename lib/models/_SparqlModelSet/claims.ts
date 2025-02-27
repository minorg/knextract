import { Claim, ClaimQuery } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { dataFactory, datasetCoreFactory } from "@/lib/rdfEnvironment";
import { knextract } from "@/lib/vocabularies";
import { rdf } from "@tpluscode/rdf-ns-builders";
import { Either, EitherAsync } from "purify-ts";
import { toRdf } from "rdf-literal";
import * as sparqljs from "sparqljs";

const claimVariable = dataFactory.variable!("claim");

function claimQueryToWherePatterns(
  query: ClaimQuery,
): readonly sparqljs.Pattern[] {
  switch (query.type) {
    case "All":
      return [];
    case "Document": {
      const patterns: sparqljs.Pattern[] = [];
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
      if (typeof query.gold !== "undefined") {
        patterns.push({
          triples: [
            {
              object: toRdf(query.gold),
              predicate: knextract.gold,
              subject: claimVariable,
            },
          ],
          type: "bgp",
        });
      }
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
  const queryString = Claim.sparqlConstructQueryString({
    subject: claimVariable,
    variablePrefix: "claim",
    where: claimQueryToWherePatterns(query).concat(),
  });
  console.log(queryString);
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
