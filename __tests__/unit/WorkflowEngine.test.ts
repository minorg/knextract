import { testData } from "@/__tests__/unit/data";
import { MockLanguageModel } from "@/__tests__/unit/language-models/MockLanguageModel";
import { MockLanguageModelFactory } from "@/__tests__/unit/language-models/MockLanguageModelFactory";
import { expectModelsEqual } from "@/__tests__/unit/models/expectModelsEqual";
import { questionnaireAdministrationAnswers } from "@/__tests__/unit/questionnaireAdministrationAnswers";
import { WorkflowEngine } from "@/lib/WorkflowEngine";
import { LanguageModelFactory } from "@/lib/language-models";
import {
  BooleanValue,
  CategoricalValue,
  Claim,
  DocumentStub,
  Exception,
  Identifier,
  RealValue,
  TextValue,
  Workflow,
  WorkflowStub,
  stubify,
} from "@/lib/models";
import { dataFactory } from "@/lib/rdfEnvironment";
import { describe, expect, it } from "vitest";

describe("WorkflowEngine", () => {
  const {
    concept,
    document,
    modelSet: medlinePlusModelSet,
  } = testData.medlinePlus;
  const modelSet = medlinePlusModelSet.cloneSync();
  const { questions, workflows } = testData.synthetic;
  for (const workflow of Object.values(workflows)) {
    modelSet.addModelSync(workflow);
  }

  function createWorkflowEngine(options?: {
    languageModelFactory?: LanguageModelFactory;
  }) {
    return new WorkflowEngine({
      languageModelFactory:
        options?.languageModelFactory ??
        new LanguageModelFactory({
          credentials: {
            openai: null,
          },
          specifications: [],
        }),
      modelSet,
    });
  }

  async function testWorkflow({
    languageModelInvocationResults,
    workflow,
  }: {
    languageModelInvocationResults: (Error | string)[];
    workflow: Workflow;
  }): Promise<readonly Claim[]> {
    const modelSetClone = modelSet.cloneSync();
    modelSetClone.addModelSync(workflow);

    const workflowExecution = await createWorkflowEngine({
      languageModelFactory: new MockLanguageModelFactory(
        new MockLanguageModel({
          invocationResults: languageModelInvocationResults,
          contextWindow: 128000,
        }),
      ),
    }).execute({
      document: stubify(document),
      workflow: stubify(workflow),
    });
    if (workflowExecution.output.type === "Exception") {
      throw new Error(workflowExecution.output.message);
    }
    return workflowExecution.subProcesses.stepExecutions.flatMap(
      (stepExecution) =>
        stepExecution.type === "WorkflowQuestionnaireStepExecution" &&
        stepExecution.output.type !== "Exception"
          ? stepExecution.subProcesses.questionnaireAdministration
              .map(questionnaireAdministrationAnswers)
              .orDefault([])
              .flatMap((answer) => answer.claims)
          : [],
    );
  }

  it("should execute a questionnaire step", async () => {
    const actualClaims = await testWorkflow({
      languageModelInvocationResults: [
        Identifier.toString(concept.identifier),
        "true",
        "1.0",
        "test",
      ],
      workflow: workflows.questionnaireStep,
    });
    expect(actualClaims).toHaveLength(4);
    expectModelsEqual(
      new Claim({
        gold: false,
        predicate: questions.categorical.path,
        object: new CategoricalValue({
          value: stubify(concept),
        }),
        subject: document.identifier,
      }),
      actualClaims[0],
    );
    expectModelsEqual(
      new Claim({
        gold: false,
        predicate: questions.dichotomous.path,
        object: new BooleanValue({
          value: true,
        }),
        subject: document.identifier,
      }),
      actualClaims[1],
    );
    expectModelsEqual(
      new Claim({
        gold: false,
        predicate: questions.realValued.path,
        object: new RealValue({
          value: 1.0,
        }),
        subject: document.identifier,
      }),
      actualClaims[2],
    );
    expectModelsEqual(
      new Claim({
        gold: false,
        predicate: questions.text.path,
        object: new TextValue({
          value: "test",
        }),
        subject: document.identifier,
      }),
      actualClaims[3],
    );
  });

  // it("should use a custom prompt on an questionnaire step", async ({ expect }) => {
  //   const mockLanguageModel = new MockLanguageModel({
  //     contextWindow: 128000,
  //     invocationResults: [JSON.stringify({ matches: [1] })],
  //   });
  //   const claims = await testWorkflow({
  //     annotatorFactory: new ConceptAnnotatorFactory({
  //       languageModelFactory: new MockLanguageModelFactory(mockLanguageModel),
  //     }),
  //     workflow: new Workflow({
  //       label: "Custom prompt workflow",
  //       steps: [
  //         new Workflow.ConceptAnnotatorStep({
  //           conceptSelector: new EnumeratedConceptSelector({
  //             concepts: [synthetic.Stub.fromModel(concept)],
  //           }),
  //           conceptAnnotatorParameters:
  //             annotatorParameters.languageModelConceptAnnotatorParameters,
  //           priority: 1,
  //         }),
  //       ],
  //     }),
  //   });
  //   expect(mockLanguageModel.invocations).toHaveLength(1);
  //   const languageModelInvocation = mockLanguageModel.invocations[0];
  //   expect(languageModelInvocation.messages).toHaveLength(5);
  //   expect(languageModelInvocation.messages[0].literalForm).toStrictEqual(
  //     "System message",
  //   );
  //   expect(languageModelInvocation.messages[4].literalForm).toContain(
  //     concept.displayLabel,
  //   );

  //   expect(claims).toHaveLength(1);
  //   const claim = claims[0];
  //   expect(
  //     claim
  //       .equals(
  //         ConceptClaim.create({
  //           gold: claim.gold,
  //           object: concept,
  //           subject: synthetic.Stub.fromModel(document),
  //         }),
  //       )
  //       .extract(),
  //   ).toStrictEqual(true);
  // });

  it("should handle an unresolvable Document stub", async ({ expect }) => {
    const execution = await createWorkflowEngine().execute({
      document: new DocumentStub({
        identifier: dataFactory.namedNode("http://example.com/nonextant"),
      }),
      workflow: stubify(workflows.questionnaireStep),
    });
    expect(execution.output.type).toStrictEqual("Exception");
    expect((execution.output as Exception).message).toMatch(
      /unable to resolve document/,
    );
  });

  it("should handle an unresolvable Workflow stub", async ({ expect }) => {
    const execution = await createWorkflowEngine().execute({
      document: stubify(document),
      workflow: new WorkflowStub({
        identifier: dataFactory.namedNode("http://example.com/nonextant"),
      }),
    });
    expect(execution.output.type).toStrictEqual("Exception");
    expect((execution.output as Exception).message).toMatch(
      /unable to resolve workflow/,
    );
  });
});
