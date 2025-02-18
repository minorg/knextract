import { DocumentStub, Identifier } from "@/lib/models";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { Either } from "purify-ts";

export async function documentStub(
  this: SparqlModelSet,
  identifier: Identifier,
): Promise<Either<Error, DocumentStub>> {
  return this.modelByIdentifier({
    identifier,
    modelFactory: {
      fromRdf: DocumentStub.fromRdf,
      sparqlConstructQueryString: DocumentStub.sparqlConstructQueryString,
    },
  });
}
