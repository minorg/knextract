import {
  WorkflowQuery,
  WorkflowStub,
  sortModelsByIdentifier,
} from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { Either } from "purify-ts";

export async function workflowStubs(
  this: RdfjsDatasetModelSet,
  parameters: {
    query: WorkflowQuery;
  },
): Promise<Either<Error, readonly WorkflowStub[]>> {
  return Either.of(this.workflowStubsSync(parameters));
}

export function workflowStubsSync(
  this: RdfjsDatasetModelSet,
  {
    query,
  }: {
    query: WorkflowQuery;
  },
): readonly WorkflowStub[] {
  switch (query.type) {
    case "All":
      return sortModelsByIdentifier([
        ...this.resourceSet
          .namedInstancesOf(WorkflowStub.fromRdfType)
          .flatMap((resource) =>
            WorkflowStub.fromRdf({
              ignoreRdfType: true,
              languageIn: this.languageIn,
              resource,
            })
              .toMaybe()
              .toList(),
          )
          .filter((model) => query.includeDeleted || !model.deleted),
      ]);
  }
}
