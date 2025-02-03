import {
  WorkflowExecution,
  WorkflowExecutionQuery,
  WorkflowExecutionStub,
  sortModelsByIdentifier,
  stubify,
} from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { Either } from "purify-ts";

export async function workflowExecutionStubs(
  this: RdfjsDatasetModelSet,
  parameters: {
    query: WorkflowExecutionQuery;
  },
): Promise<Either<Error, readonly WorkflowExecutionStub[]>> {
  return Either.of(this.workflowExecutionStubsSync(parameters));
}

export function workflowExecutionStubsSync(
  this: RdfjsDatasetModelSet,
  {
    query,
  }: {
    query: WorkflowExecutionQuery;
  },
): readonly WorkflowExecutionStub[] {
  switch (query.type) {
    case "All":
      return sortModelsByIdentifier([
        ...this.resourceSet
          .namedInstancesOf(WorkflowExecutionStub.fromRdfType)
          .flatMap((resource) =>
            WorkflowExecutionStub.fromRdf({
              ignoreRdfType: true,
              languageIn: this.languageIn,
              resource,
            })
              .toMaybe()
              .toList(),
          ),
      ]);
    case "ClaimGenerator": {
      const workflowExecutionStubs: WorkflowExecutionStub[] = [];
      for (const workflowExecutionResource of this.resourceSet.namedInstancesOf(
        WorkflowExecution.fromRdfType,
      )) {
        WorkflowExecution.fromRdf({
          ignoreRdfType: true,
          languageIn: this.languageIn,
          resource: workflowExecutionResource,
        }).ifRight((workflowExecution) => {
          for (const workflowStepExecution of workflowExecution.subProcesses
            .stepExecutions) {
            if (
              workflowStepExecution.type !==
              "WorkflowQuestionnaireStepExecution"
            ) {
              continue;
            }
            const questionnaireAdministration =
              workflowStepExecution.subProcesses.questionnaireAdministration.extractNullable();
            if (
              questionnaireAdministration === null ||
              questionnaireAdministration.output.type !==
                "QuestionnaireAdministrationOutput"
            ) {
              continue;
            }
            for (const answer of questionnaireAdministration.output.answers) {
              for (const claim of answer.claims) {
                if (claim.identifier.equals(query.claimIdentifier)) {
                  workflowExecutionStubs.push(stubify(workflowExecution));
                }
              }
            }
          }
        });
      }
      return sortModelsByIdentifier(workflowExecutionStubs);
    }
    case "Workflow": {
      const workflowExecutionStubs: WorkflowExecutionStub[] = [];
      for (const workflowExecutionResource of this.resourceSet.namedInstancesOf(
        WorkflowExecution.fromRdfType,
      )) {
        WorkflowExecution.fromRdf({
          ignoreRdfType: true,
          languageIn: this.languageIn,
          resource: workflowExecutionResource,
        }).ifRight((workflowExecution) => {
          if (
            workflowExecution.input.workflow.identifier.equals(
              query.workflowIdentifier,
            )
          ) {
            workflowExecutionStubs.push(stubify(workflowExecution));
          }
        });
      }
      return sortModelsByIdentifier(workflowExecutionStubs);
    }
  }
}
