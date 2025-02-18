import {
  Answer,
  Claim,
  WorkflowExecution,
  WorkflowQuestionnaireStepExecution,
} from "@/lib/models";

export function claims(
  model: Answer | WorkflowExecution | WorkflowQuestionnaireStepExecution,
): readonly Claim[] {
  switch (model.type) {
    case "Answer":
      return model.claims;
    case "WorkflowExecution":
      return model.subProcesses.stepExecutions.flatMap((stepExecution) =>
        stepExecution.type === "WorkflowQuestionnaireStepExecution"
          ? claims(stepExecution)
          : [],
      );
    case "WorkflowQuestionnaireStepExecution":
      return model.output.type !== "Exception"
        ? model.output.answers.flatMap(claims)
        : [];
  }
}
