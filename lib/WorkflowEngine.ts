import { QuestionnaireAdministrator } from "@/lib/QuestionnaireAdministrator";
import { LanguageModel, LanguageModelFactory } from "@/lib/language-models";
import {
  Document,
  DocumentStub,
  Exception,
  Identifier,
  ModelSet,
  PostWorkflowExecutionEvent,
  PostWorkflowStepExecutionEvent,
  PreWorkflowExecutionEvent,
  PreWorkflowStepExecutionEvent,
  WorkflowExecution,
  WorkflowExecutionInput,
  WorkflowExecutionOutput,
  WorkflowExecutionSubProcesses,
  WorkflowQuestionnaireStep,
  WorkflowQuestionnaireStepExecution,
  WorkflowQuestionnaireStepExecutionInput,
  WorkflowQuestionnaireStepExecutionOutput,
  WorkflowQuestionnaireStepExecutionSubProcesses,
  WorkflowStep,
  WorkflowStepExecution,
  WorkflowStub,
} from "@/lib/models";
import Emittery, { Options as EmitteryOptions } from "emittery";
import { Either, Maybe } from "purify-ts";

type EventData = {
  postExecution: PostWorkflowExecutionEvent;
  postStepExecution: PostWorkflowStepExecutionEvent;
  preExecution: PreWorkflowExecutionEvent;
  preStepExecution: PreWorkflowStepExecutionEvent;
};

interface ExecutionContext {
  readonly document: Document;
  readonly documentStub: DocumentStub;
}

export class WorkflowEngine extends Emittery<EventData> {
  private readonly languageModelFactory: LanguageModelFactory;
  private readonly modelSet: ModelSet;

  constructor({
    languageModelFactory,
    modelSet,
    ...emitteryOptions
  }: {
    languageModelFactory: LanguageModelFactory;
    modelSet: ModelSet;
  } & EmitteryOptions<EventData>) {
    super(emitteryOptions);
    this.languageModelFactory = languageModelFactory;
    this.modelSet = modelSet;
  }

  async execute({
    document: documentStub,
    workflow: workflowStub,
  }: {
    document: DocumentStub;
    workflow: WorkflowStub;
  }): Promise<WorkflowExecution> {
    const startedAtTime = new Date();

    const workflowExecutionInput = new WorkflowExecutionInput({
      document: documentStub,
      workflow: workflowStub,
    });

    const workflowEither = await this.modelSet.workflow(
      workflowStub.identifier,
    );
    if (workflowEither.isLeft()) {
      return new WorkflowExecution({
        endedAtTime: Maybe.of(new Date()),
        input: workflowExecutionInput,
        output: new Exception({
          message: `unable to resolve workflow: ${Identifier.toString(workflowStub.identifier)}`,
        }),
        startedAtTime,
        subProcesses: new WorkflowExecutionSubProcesses({
          stepExecutions: [],
        }),
      });
    }
    const workflow = workflowEither.unsafeCoerce();

    const documentEither = await this.modelSet.document(
      documentStub.identifier,
    );
    if (documentEither.isLeft()) {
      return new WorkflowExecution({
        endedAtTime: Maybe.of(new Date()),
        input: workflowExecutionInput,
        output: new Exception({
          message: `unable to resolve document: ${Identifier.toString(documentStub.identifier)}`,
        }),
        startedAtTime,
        subProcesses: new WorkflowExecutionSubProcesses({
          stepExecutions: [],
        }),
      });
    }
    const document = documentEither.unsafeCoerce();

    await this.emit(
      "preExecution",
      new PreWorkflowExecutionEvent({
        payload: workflowExecutionInput,
        timestamp: new Date(),
      }),
    );

    const stepExecutions = await this.executeSteps({
      document,
      documentStub,
      steps: workflow.steps,
    });

    const workflowExecution = new WorkflowExecution({
      endedAtTime: new Date(),
      input: workflowExecutionInput,
      output:
        (stepExecutions.find(
          (stepExecution) => stepExecution.output.type === "Exception",
        )?.output as Exception | undefined) ?? new WorkflowExecutionOutput({}),
      startedAtTime: new Date(),
      subProcesses: new WorkflowExecutionSubProcesses({
        stepExecutions: [],
      }),
    });

    await this.emit(
      "postExecution",
      new PostWorkflowExecutionEvent({
        payload: workflowExecution,
        timestamp: new Date(),
      }),
    );

    return workflowExecution;
  }

  private async executeQuestionnaireStep({
    document,
    step,
    ...executionContext
  }: {
    step: WorkflowQuestionnaireStep;
  } & ExecutionContext): Promise<WorkflowQuestionnaireStepExecution> {
    const startedAtTime = new Date();

    const input = new WorkflowQuestionnaireStepExecutionInput({
      document: executionContext.documentStub,
      step,
    });

    await this.emit(
      "preStepExecution",
      new PreWorkflowStepExecutionEvent({
        payload: input,
        timestamp: new Date(),
      }),
    );

    let languageModelEither: Either<Error, LanguageModel>;
    if (step.languageModel.isJust()) {
      languageModelEither = (
        await this.modelSet.languageModelSpecification(
          step.languageModel.unsafeCoerce().identifier,
        )
      ).chain((languageModelSpecification) =>
        this.languageModelFactory.createLanguageModelFromSpecification(
          languageModelSpecification,
        ),
      );
    } else {
      languageModelEither =
        this.languageModelFactory.createDefaultLanguageModel();
    }

    if (languageModelEither.isLeft()) {
      const stepExecution = new WorkflowQuestionnaireStepExecution({
        endedAtTime: new Date(),
        input,
        output: languageModelEither
          .mapLeft((error) => new Exception({ message: error.message }))
          .extract(),
        subProcesses: new WorkflowQuestionnaireStepExecutionSubProcesses({}),
        startedAtTime,
      });
      await this.emit(
        "postStepExecution",
        new PostWorkflowStepExecutionEvent({
          payload: stepExecution,
          timestamp: new Date(),
        }),
      );
      return stepExecution;
    }
    const languageModel = languageModelEither.unsafeCoerce();

    const questionnaireAdministrator = new QuestionnaireAdministrator({
      document,
      languageModel,
      modelSet: this.modelSet,
    });

    const questionnaireAdministration =
      await questionnaireAdministrator.administer({
        questionnaire: step.questionnaire,
      });

    const stepExecution = new WorkflowQuestionnaireStepExecution({
      endedAtTime: new Date(),
      input,
      output:
        questionnaireAdministration.output.type === "Exception"
          ? questionnaireAdministration.output
          : new WorkflowQuestionnaireStepExecutionOutput({}),
      startedAtTime,
      subProcesses: new WorkflowQuestionnaireStepExecutionSubProcesses({
        questionnaireAdministration,
      }),
    });
    await this.emit(
      "postStepExecution",
      new PostWorkflowStepExecutionEvent({
        payload: stepExecution,
        timestamp: new Date(),
      }),
    );
    return stepExecution;
  }

  private async executeStep({
    step,
    ...executionContext
  }: {
    step: WorkflowStep;
  } & ExecutionContext): Promise<WorkflowStepExecution> {
    switch (step.type) {
      case "WorkflowQuestionnaireStep":
        return this.executeQuestionnaireStep({ step, ...executionContext });
    }
  }

  private async executeSteps({
    steps,
    ...executionContext
  }: {
    steps: readonly WorkflowStep[];
  } & ExecutionContext): Promise<readonly WorkflowStepExecution[]> {
    const stepExecutions: WorkflowStepExecution[] = [];
    for (const step of steps) {
      stepExecutions.push(
        await this.executeStep({ step, ...executionContext }),
      );
    }
    return stepExecutions;
  }
}
