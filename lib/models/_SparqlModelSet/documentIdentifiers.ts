import { DocumentQuery, Identifier } from "@/lib/models";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { documentQueryToWherePatterns } from "@/lib/models/_SparqlModelSet/documentQueryToWherePatterns";
import { prefixes } from "@/lib/models/_SparqlModelSet/prefixes";
import { dataFactory } from "@/lib/rdfEnvironment";
import { mapBindingsToIdentifiers } from "@kos-kit/models";
import { Either, EitherAsync } from "purify-ts";

const documentVariable = dataFactory.variable!("document");

export async function documentIdentifiers(
  this: SparqlModelSet,
  {
    limit,
    offset,
    query,
  }: {
    limit: null | number;
    offset: number;
    query: DocumentQuery;
  },
): Promise<Either<Error, readonly Identifier[]>> {
  return EitherAsync(async () =>
    mapBindingsToIdentifiers(
      await this.sparqlQueryClient.queryBindings(
        this.sparqlGenerator.stringify({
          distinct: true,
          limit: limit ?? undefined,
          offset,
          order: [{ expression: documentVariable }],
          prefixes,
          queryType: "SELECT",
          type: "query",
          variables: [documentVariable],
          where: documentQueryToWherePatterns({
            query,
            subject: documentVariable,
          }).concat(),
        }),
      ),
      documentVariable.value,
    ),
  );
}
