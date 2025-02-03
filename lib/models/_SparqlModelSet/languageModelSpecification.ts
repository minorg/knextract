import { Identifier, LanguageModelSpecification } from "@/lib/models";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { Either } from "purify-ts";

export async function languageModelSpecification(
  this: SparqlModelSet,
  identifier: Identifier,
): Promise<Either<Error, LanguageModelSpecification>> {
  return this.modelByIdentifier({
    identifier,
    modelFactory: {
      fromRdf: LanguageModelSpecification.fromRdf,
      sparqlConstructQueryString:
        LanguageModelSpecification.sparqlConstructQueryString,
    },
  });
}
