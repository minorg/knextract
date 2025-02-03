import { Identifier, Workflow } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { Either } from "purify-ts";

export async function workflow(
  this: RdfjsDatasetModelSet,
  identifier: Identifier,
): Promise<Either<Error, Workflow>> {
  return this.workflowSync(identifier);
}

export function workflowSync(
  this: RdfjsDatasetModelSet,
  identifier: Identifier,
): Either<Error, Workflow> {
  return Workflow.fromRdf({
    resource: this.resourceSet.namedResource(identifier),
    languageIn: this.languageIn,
  });
}
