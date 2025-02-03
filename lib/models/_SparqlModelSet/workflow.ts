import { Identifier, Workflow } from "@/lib/models";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { Either } from "purify-ts";

export async function workflow(
  this: SparqlModelSet,
  identifier: Identifier,
): Promise<Either<Error, Workflow>> {
  return this.modelByIdentifier({
    identifier,
    modelFactory: {
      fromRdf: Workflow.fromRdf,
      sparqlConstructQueryString: Workflow.sparqlConstructQueryString,
    },
  });
}
