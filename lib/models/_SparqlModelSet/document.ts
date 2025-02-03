import { Document, Identifier } from "@/lib/models";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { Either } from "purify-ts";

export async function document(
  this: SparqlModelSet,
  identifier: Identifier,
): Promise<Either<Error, Document>> {
  return this.modelByIdentifier({
    identifier,
    modelFactory: {
      fromRdf: Document.fromRdf,
      sparqlConstructQueryString: Document.sparqlConstructQueryString,
    },
  });
}
