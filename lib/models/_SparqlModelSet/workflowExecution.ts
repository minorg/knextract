import { Identifier, WorkflowExecution } from "@/lib/models";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { Either } from "purify-ts";

export async function workflowExecution(
  this: SparqlModelSet,
  identifier: Identifier,
): Promise<Either<Error, WorkflowExecution>> {
  return this.modelByIdentifier({
    identifier,
    modelFactory: {
      fromRdf: WorkflowExecution.fromRdf,
      sparqlConstructQueryString: WorkflowExecution.sparqlConstructQueryString,
    },
  });
}
