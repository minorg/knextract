import { ClaimProperty, CorpusStub } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { dataFactory, datasetCoreFactory } from "@/lib/rdfEnvironment";
import { sparqlRdfTypePattern } from "@kos-kit/models/sparqlRdfTypePattern";
import { Either, EitherAsync } from "purify-ts";

const claimPropertyVariable = dataFactory.variable!("claimPropertyVariable");

export async function claimProperties(
  this: SparqlModelSet,
): Promise<Either<Error, readonly ClaimProperty[]>> {
  return EitherAsync(async () =>
    new RdfjsDatasetModelSet({
      dataset: datasetCoreFactory.dataset(
        (
          await this.sparqlQueryClient.queryQuads(
            CorpusStub.sparqlConstructQueryString({
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
    }).claimPropertiesSync(),
  );
}
