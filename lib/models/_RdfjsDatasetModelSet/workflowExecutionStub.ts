import { Identifier, WorkflowExecutionStub } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { Either } from "purify-ts";

export async function workflowExecutionStub(
  this: RdfjsDatasetModelSet,
  identifier: Identifier,
): Promise<Either<Error, WorkflowExecutionStub>> {
  return this.workflowExecutionStubSync(identifier);
}

export function workflowExecutionStubSync(
  this: RdfjsDatasetModelSet,
  identifier: Identifier,
): Either<Error, WorkflowExecutionStub> {
  return WorkflowExecutionStub.fromRdf({
    resource: this.resourceSet.namedResource(identifier),
    languageIn: this.languageIn,
  });
}
