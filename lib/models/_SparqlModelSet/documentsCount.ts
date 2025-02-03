import { DocumentQuery } from "@/lib/models/DocumentQuery";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { documentQueryToWherePatterns } from "@/lib/models/_SparqlModelSet/documentQueryToWherePatterns";
import { prefixes } from "@/lib/models/_SparqlModelSet/prefixes";
import { dataFactory } from "@/lib/rdfEnvironment";
import { mapBindingsToCount } from "@kos-kit/models";
import { Either, EitherAsync } from "purify-ts";

const countVariable = dataFactory.variable!("count");
const documentVariable = dataFactory.variable!("document");

export async function documentsCount(
  this: SparqlModelSet,
  query: DocumentQuery,
): Promise<Either<Error, number>> {
  return EitherAsync(async ({ liftEither }) =>
    liftEither(
      mapBindingsToCount(
        await this.sparqlQueryClient.queryBindings(
          this.sparqlGenerator.stringify({
            distinct: true,
            prefixes,
            queryType: "SELECT",
            type: "query",
            variables: [
              {
                expression: {
                  aggregation: "COUNT",
                  distinct: true,
                  expression: documentVariable,
                  type: "aggregate",
                },
                variable: countVariable,
              },
            ],
            where: documentQueryToWherePatterns({
              query,
              subject: documentVariable,
            }).concat(),
          }),
        ),
        countVariable.value,
      ),
    ),
  );
}
