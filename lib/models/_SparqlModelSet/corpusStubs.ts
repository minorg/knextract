import { CorpusQuery, CorpusStub } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { sparqlFilterDeletedPattern } from "@/lib/models/_SparqlModelSet/sparqlFilterDeletedPattern";
import { dataFactory, datasetCoreFactory } from "@/lib/rdfEnvironment";
import { Either, EitherAsync } from "purify-ts";
import * as sparqljs from "sparqljs";
import { invariant } from "ts-invariant";

const corpusVariable = dataFactory.variable!("corpus");

function corpusQueryToWherePatterns(
  query: CorpusQuery,
): readonly sparqljs.Pattern[] {
  invariant(query.type === "All");
  return sparqlFilterDeletedPattern({
    query,
    subject: corpusVariable,
  }).toList();
}

export async function corpusStubs(
  this: SparqlModelSet,
  { query }: { query: CorpusQuery },
): Promise<Either<Error, readonly CorpusStub[]>> {
  return EitherAsync(async () =>
    new RdfjsDatasetModelSet({
      dataset: datasetCoreFactory.dataset(
        (
          await this.sparqlQueryClient.queryQuads(
            CorpusStub.sparqlConstructQueryString({
              subject: corpusVariable,
              variablePrefix: "corpus",
              where: corpusQueryToWherePatterns(query).concat(),
            }),
          )
        ).concat(),
      ),
      languageIn: this.languageIn,
    }).corpusStubsSync({
      query: { includeDeleted: query.includeDeleted, type: "All" },
    }),
  );
}
