import { Identifier, WorkflowExecutionStub } from "@/lib/models";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { Either } from "purify-ts";

export async function workflowExecutionStub(
  this: SparqlModelSet,
  identifier: Identifier,
): Promise<Either<Error, WorkflowExecutionStub>> {
  return this.modelByIdentifier({
    identifier,
    modelFactory: {
      fromRdf: WorkflowExecutionStub.fromRdf,
      sparqlConstructQueryString:
        WorkflowExecutionStub.sparqlConstructQueryString,
    },
  });
}
