import { testData } from "@/__tests__/unit/data";
import { WorkflowEngine } from "@/lib/WorkflowEngine";
import { LanguageModelFactory } from "@/lib/language-models";
import {
  CategoricalValue,
  Claim,
  DocumentStub,
  Exception,
  Workflow,
  WorkflowStub,
  stubify,
} from "@/lib/models";
import { dataFactory } from "@/lib/rdfEnvironment";
import { dcterms } from "@tpluscode/rdf-ns-builders";
import { describe, expect, it } from "vitest";

describe("WorkflowEngine", () => {
  const { concept, document, modelSet } = testData.medlinePlus;
  const { workflows } = testData.synthetic;

  function expectSingleClaim({
    claims,
  }: {
    claims: readonly Claim[];
  }): void {
    expect(claims).toHaveLength(1);
    const claim = claims[0];
    expect(
      claim
        .equals(
          new Claim({
            gold: claim.gold,
            predicate: dcterms.subject,
            object: new CategoricalValue({
              value: stubify(concept),
            }),
            subject: document.identifier,
          }),
        )
        .extract(),
    ).toStrictEqual(true);
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
    languageModelFactory,
    workflow,
  }: {
    languageModelFactory?: LanguageModelFactory;
    workflow: Workflow;
  }): Promise<readonly Claim[]> {
    const modelSetClone = modelSet.cloneSync();
    modelSetClone.addModelSync(workflow);

    const workflowExecution = await createWorkflowEngine({
      languageModelFactory,
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
              .map((questionnaireAdministration) =>
                questionnaireAdministration.subProcesses.questionAdministrations.flatMap(
                  (questionAdministration) =>
                    questionAdministration.output.type !== "Exception"
                      ? questionAdministration.output.answer.claims
                      : [],
                ),
              )
              .orDefault([])
          : [],
    );
  }

  it("should execute a questionnaire step", async () => {
    expectSingleClaim({
      claims: await testWorkflow({
        workflow: workflows.questionnaireStep,
      }),
    });
  });

  // it("should use a custom prompt on an claim step", async ({ expect }) => {
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
