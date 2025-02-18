import { Identifier, LanguageModelSpecificationStub } from "@/lib/models";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { Either } from "purify-ts";

export async function languageModelSpecificationStub(
  this: SparqlModelSet,
  identifier: Identifier,
): Promise<Either<Error, LanguageModelSpecificationStub>> {
  return this.modelByIdentifier({
    identifier,
    modelFactory: {
      fromRdf: LanguageModelSpecificationStub.fromRdf,
      sparqlConstructQueryString:
        LanguageModelSpecificationStub.sparqlConstructQueryString,
    },
  });
}
