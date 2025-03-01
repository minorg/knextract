import {
  Answer,
  Claim,
  Exception,
  QuestionAdministration,
  QuestionnaireAdministration,
  WorkflowExecution,
  WorkflowQuestionnaireStepExecution,
} from "@/lib/models";
import { Either, Left } from "purify-ts";

export function claims(
  model:
    | Answer
    | QuestionAdministration
    | QuestionnaireAdministration
    | WorkflowExecution
    | WorkflowQuestionnaireStepExecution,
): Either<Exception, readonly Claim[]> {
  switch (model.type) {
    case "Answer":
      return Either.of(model.claims);
    case "QuestionAdministration": {
      if (model.output.type === "Exception") {
        return Left(model.output);
      }
      return claims(model.output.answer);
    }
    case "QuestionnaireAdministration": {
      if (model.output.type === "Exception") {
        return Left(model.output);
      }
      let result: Claim[] = [];
      for (const either of model.subProcesses.questionAdministrations.map(
        claims,
      )) {
        if (either.isLeft()) {
          return either;
        }
        result = result.concat(either.unsafeCoerce());
      }
      return Either.of(result);
    }
    case "WorkflowExecution": {
      if (model.output.type === "Exception") {
        return Left(model.output);
      }
      let result: Claim[] = [];
      for (const stepExecution of model.subProcesses.stepExecutions) {
        if (stepExecution.type !== "WorkflowQuestionnaireStepExecution") {
          continue;
        }
        const either = claims(stepExecution);
        if (either.isLeft()) {
          return either;
        }
        result = result.concat(either.unsafeCoerce());
      }
      return Either.of(result);
    }
    case "WorkflowQuestionnaireStepExecution": {
      if (model.output.type === "Exception") {
        return Left(model.output);
      }
      if (model.subProcesses.questionnaireAdministration.isNothing()) {
        return Either.of([]);
      }
      return claims(
        model.subProcesses.questionnaireAdministration.unsafeCoerce(),
      );
    }
  }
}
