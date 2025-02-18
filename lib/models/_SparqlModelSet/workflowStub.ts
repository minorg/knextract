import { Identifier, WorkflowStub } from "@/lib/models";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { Either } from "purify-ts";

export async function workflowStub(
  this: SparqlModelSet,
  identifier: Identifier,
): Promise<Either<Error, WorkflowStub>> {
  return this.modelByIdentifier({
    identifier,
    modelFactory: {
      fromRdf: WorkflowStub.fromRdf,
      sparqlConstructQueryString: WorkflowStub.sparqlConstructQueryString,
    },
  });
}
