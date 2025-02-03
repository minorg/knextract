import { LanguageModelSpecification } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { dataFactory, datasetCoreFactory } from "@/lib/rdfEnvironment";
import { Either, EitherAsync } from "purify-ts";

const languageModelSpecificationVariable = dataFactory.variable!(
  "languageModelSpecification",
);

export async function languageModelSpecifications(
  this: SparqlModelSet,
): Promise<Either<Error, readonly LanguageModelSpecification[]>> {
  return EitherAsync(async () =>
    new RdfjsDatasetModelSet({
      dataset: datasetCoreFactory.dataset(
        (
          await this.sparqlQueryClient.queryQuads(
            LanguageModelSpecification.sparqlConstructQueryString({
              subject: languageModelSpecificationVariable,
              variablePrefix: "languageModelSpecification",
            }),
          )
        ).concat(),
      ),
      languageIn: this.languageIn,
    }).languageModelSpecificationsSync(),
  );
}
