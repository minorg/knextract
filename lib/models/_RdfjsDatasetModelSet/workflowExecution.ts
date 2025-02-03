import { Identifier, WorkflowExecution } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { Either } from "purify-ts";

export async function workflowExecution(
  this: RdfjsDatasetModelSet,
  identifier: Identifier,
): Promise<Either<Error, WorkflowExecution>> {
  return this.workflowExecutionSync(identifier);
}

export function workflowExecutionSync(
  this: RdfjsDatasetModelSet,
  identifier: Identifier,
): Either<Error, WorkflowExecution> {
  return WorkflowExecution.fromRdf({
    resource: this.resourceSet.namedResource(identifier),
    languageIn: this.languageIn,
  });
}
