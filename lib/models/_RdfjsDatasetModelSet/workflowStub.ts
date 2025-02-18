import { Identifier, WorkflowStub } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { Either } from "purify-ts";

export async function workflowStub(
  this: RdfjsDatasetModelSet,
  identifier: Identifier,
): Promise<Either<Error, WorkflowStub>> {
  return this.workflowStubSync(identifier);
}

export function workflowStubSync(
  this: RdfjsDatasetModelSet,
  identifier: Identifier,
): Either<Error, WorkflowStub> {
  return WorkflowStub.fromRdf({
    resource: this.resourceSet.namedResource(identifier),
    languageIn: this.languageIn,
  });
}
