import { testData } from "@/__tests__/unit/data";
import { expectEqualResult } from "@/__tests__/unit/models/expectEqualResult";
import { expectModelsEqual } from "@/__tests__/unit/models/expectModelsEqual";
import { expectModelsUnequal } from "@/__tests__/unit/models/expectModelsUnequal";
import {
  type Claim,
  Corpus,
  type CorpusQuery,
  type CorpusStub,
  Document,
  type DocumentQuery,
  type EqualsResult,
  type ModelSet,
  type QuestionAdministrationOutput,
  Workflow,
  type WorkflowExecution,
  type WorkflowExecutionQuery,
  type WorkflowQuery,
  arrayEquals,
  sortModelsByIdentifier,
  stubify,
} from "@/lib/models";
import type { Either } from "purify-ts";
import { type ExpectStatic, it } from "vitest";

// const CI = !!process.env["CI"];

export async function behavesLikeModelSet({
  immutableModelSet,
  sparql,
  withEmptyMutableModelSet,
}: {
  immutableModelSet: ModelSet;
  sparql?: boolean;
  withEmptyMutableModelSet: (
    use: (mutableModelSet: ModelSet) => Promise<void>,
  ) => Promise<void>;
}) {
  const syntheticTestData = testData.synthetic;
  const medlinePlusTestData = testData.medlinePlus;

  const testAddModel = async <
    ModelT extends ModelSet.AddableModel & {
      equals: (other: ModelT) => EqualsResult;
    },
  >({
    actualModel,
    expectedModel,
  }: {
    actualModel: (modelSet: ModelSet) => Promise<Either<Error, ModelT>>;
    expect: ExpectStatic;
    expectedModel: ModelT;
  }) =>
    withEmptyMutableModelSet(async (modelSet) => {
      await modelSet.addModel(expectedModel);
      expectModelsEqual(
        expectedModel,
        (await actualModel(modelSet)).unsafeCoerce(),
      );
    });

  const testDeleteModel = async <
    ModelT extends ModelSet.AddableModel &
      ModelSet.DeletableModel & {
        equals: (other: ModelT) => EqualsResult;
      },
  >({
    expect,
    getModelFromModelSet,
    syntheticModel,
  }: {
    expect: ExpectStatic;
    getModelFromModelSet: (
      modelSet: ModelSet,
    ) => Promise<Either<Error, ModelT>>;
    syntheticModel: ModelT;
  }) =>
    withEmptyMutableModelSet(async (modelSet) => {
      expect(syntheticModel.deleted).toStrictEqual(false);
      expect((await modelSet.isEmpty()).unsafeCoerce()).toStrictEqual(true);
      await modelSet.addModel(syntheticModel);
      expect((await modelSet.isEmpty()).unsafeCoerce()).toStrictEqual(false);
      const preDeletionModel = (
        await getModelFromModelSet(modelSet)
      ).unsafeCoerce();
      expectModelsEqual(syntheticModel, preDeletionModel);
      expect(preDeletionModel.deleted).toStrictEqual(false);

      await modelSet.deleteModel(syntheticModel);

      const postDeletionModel = (
        await getModelFromModelSet(modelSet)
      ).unsafeCoerce();
      expect(postDeletionModel.deleted).toStrictEqual(true);
      expectModelsUnequal(syntheticModel, postDeletionModel);
    });

  syntheticTestData.claims.forEach((expectedModel, expectedModelI) => {
    it(`addModel (Claim) ${expectedModelI}`, async ({ expect }) => {
      await testAddModel({
        actualModel: (modelSet) => modelSet.claim(expectedModel.identifier),
        expect,
        expectedModel,
      });
    });
  });

  Object.entries(syntheticTestData.corpora).forEach(([key, expectedModel]) => {
    it(`addModel (Corpus) ${key}`, async ({ expect }) => {
      await testAddModel({
        actualModel: (modelSet) => modelSet.corpus(expectedModel.identifier),
        expect,
        expectedModel,
      });
    });
  });

  Object.entries(syntheticTestData.documents).forEach(
    ([key, expectedModel]) => {
      it(`addModel (Document) ${key}`, async ({ expect }) => {
        await testAddModel({
          actualModel: (modelSet) =>
            modelSet.document(expectedModel.identifier),
          expect,
          expectedModel,
        });
      });
    },
  );

  Object.entries(syntheticTestData.workflows).forEach(
    ([key, expectedModel]) => {
      it(`addModel (Workflow) ${key}`, async ({ expect }) => {
        await testAddModel({
          actualModel: (modelSet) =>
            modelSet.workflow(expectedModel.identifier),
          expect,
          expectedModel,
        });
      });
    },
  );

  Object.entries(syntheticTestData.workflowExecutions).forEach(
    ([key, expectedModel]) => {
      it.skipIf(sparql)(
        `addModel (WorkflowExecution) ${key}`,
        async ({ expect }) => {
          await testAddModel({
            actualModel: (modelSet) =>
              modelSet.workflowExecution(expectedModel.identifier),
            expect,
            expectedModel,
          });
        },
      );
    },
  );

  it("claim", async ({ expect }) => {
    const expectedModel = syntheticTestData.claims[0];
    await withEmptyMutableModelSet(async (modelSet) => {
      expect((await modelSet.isEmpty()).unsafeCoerce()).toStrictEqual(true);
      await modelSet.addModel(expectedModel);
      expectModelsEqual(
        expectedModel,
        (await modelSet.claim(expectedModel.identifier))
          .toMaybe()
          .extractNullable(),
      );
    });
  });

  it("claimProperties", async ({ expect }) => {
    const expectedModel = syntheticTestData.claimProperties[0];
    await withEmptyMutableModelSet(async (modelSet) => {
      expect((await modelSet.isEmpty()).unsafeCoerce()).toStrictEqual(true);
      await modelSet.addModel(expectedModel);
      const actualModels = (await modelSet.claimProperties()).unsafeCoerce();
      expect(actualModels).toHaveLength(1);
      expectModelsEqual(expectedModel, actualModels[0]);
    });
  });

  it("claims (all)", async ({ expect }) => {
    const expectedModel = syntheticTestData.claims[0];
    await withEmptyMutableModelSet(async (modelSet) => {
      expect((await modelSet.isEmpty()).unsafeCoerce()).toStrictEqual(true);
      await modelSet.addModel(expectedModel);
      const actualModels = (
        await modelSet.claims({
          query: { type: "All" },
        })
      ).unsafeCoerce();
      expect(
        actualModels.find((actualModel) =>
          actualModel.identifier.equals(expectedModel.identifier),
        ),
      ).toBeDefined();
    });
  });

  it("claims (gold)", async ({ expect }) => {
    const expectedModels = medlinePlusTestData.claims.filter(
      (claim) => claim.gold,
    );
    expect(expectedModels).not.toHaveLength(0);

    const actualModels = (
      await immutableModelSet.claims({
        query: {
          documentIdentifier: medlinePlusTestData.document.identifier,
          gold: true,
          type: "Document",
        },
      })
    ).unsafeCoerce();

    expectEqualResult(
      arrayEquals(expectedModels, actualModels, (left, right) =>
        left.equals(right),
      ),
    );
  });

  it("claims (Medline Plus document)", async ({ expect }) => {
    const expectedModels = (
      await medlinePlusTestData.modelSet.claims({
        query: {
          documentIdentifier: medlinePlusTestData.document.identifier,
          type: "Document",
        },
      })
    ).unsafeCoerce();
    expect(expectedModels).not.toHaveLength(0);

    const actualModels = (
      await immutableModelSet.claims({
        query: {
          documentIdentifier: medlinePlusTestData.document.identifier,
          type: "Document",
        },
      })
    ).unsafeCoerce();

    expectEqualResult(
      arrayEquals(expectedModels, actualModels, (left, right) =>
        left.equals(right),
      ),
    );
  });

  Object.entries(syntheticTestData.corpora).forEach(([key, expectedModel]) => {
    it(`corpus ${key}`, () => {
      withEmptyMutableModelSet(async (modelSet) => {
        await modelSet.addModel(expectedModel);
        expectModelsEqual(
          expectedModel,
          (await modelSet.corpus(expectedModel.identifier)).unsafeCoerce(),
        );
      });
    });
  });

  Object.entries(syntheticTestData.corpora).forEach(([key, expectedModel]) => {
    it(`corpusStub ${key}`, () => {
      withEmptyMutableModelSet(async (modelSet) => {
        await modelSet.addModel(expectedModel);
        expectModelsEqual(
          stubify(expectedModel),
          (await modelSet.corpusStub(expectedModel.identifier)).unsafeCoerce(),
        );
      });
    });
  });

  for (const includeDeleted of [false, true]) {
    for (const queryType of ["All"] as const) {
      it(`corpusStubs includeDeleted=${includeDeleted} queryType=${queryType}`, () =>
        withEmptyMutableModelSet(async (modelSet) => {
          const deleteModel = new Corpus({
            deleted: true,
            label: "Delete corpus",
          });
          const allModels = [
            ...Object.values(syntheticTestData.corpora),
            deleteModel,
          ];
          for (const model of allModels) {
            await modelSet.addModel(model);
          }
          await modelSet.deleteModel(deleteModel);

          let expectedModels: readonly CorpusStub[];
          let query: CorpusQuery;
          switch (queryType) {
            case "All": {
              expectedModels = (
                includeDeleted
                  ? allModels
                  : allModels.filter(
                      (corpus) =>
                        !corpus.identifier.equals(deleteModel.identifier),
                    )
              ).map((model) => stubify(model));
              query = { includeDeleted, type: "All" };
              break;
            }
          }

          const actualCorpusStubs = (
            await modelSet.corpusStubs({
              query,
            })
          ).unsafeCoerce();
          expectEqualResult(
            arrayEquals(expectedModels, actualCorpusStubs, (left, right) =>
              left.equals(right),
            ),
          );
        }));
    }
  }

  Object.entries(syntheticTestData.corpora).forEach(([key, syntheticModel]) => {
    it(`deleteModel (Corpus) ${key}`, ({ expect }) =>
      testDeleteModel({
        expect,
        getModelFromModelSet: (modelSet) =>
          modelSet.corpus(syntheticModel.identifier),
        syntheticModel,
      }));
  });

  Object.entries(syntheticTestData.documents).forEach(
    ([key, syntheticModel]) => {
      it(`deleteModel (Document) ${key}`, ({ expect }) =>
        testDeleteModel({
          expect,
          getModelFromModelSet: (modelSet) =>
            modelSet.document(syntheticModel.identifier),
          syntheticModel,
        }));
    },
  );

  Object.entries(syntheticTestData.workflows).forEach(
    ([key, syntheticModel]) => {
      it(`deleteModel (Workflow) ${key}`, ({ expect }) =>
        testDeleteModel({
          expect,
          getModelFromModelSet: (modelSet) =>
            modelSet.workflow(syntheticModel.identifier),
          syntheticModel,
        }));
    },
  );

  Object.entries(syntheticTestData.documents).forEach(
    ([key, expectedModel]) => {
      it(`document ${key}`, async () =>
        withEmptyMutableModelSet(async (modelSet) => {
          await modelSet.addModel(expectedModel);
          expectModelsEqual(
            expectedModel,
            (await modelSet.document(expectedModel.identifier)).unsafeCoerce(),
          );
        }));
    },
  );

  Object.entries(syntheticTestData.documents).forEach(
    ([key, expectedModel]) => {
      it(`documentStub ${key}`, async () =>
        withEmptyMutableModelSet(async (modelSet) => {
          await modelSet.addModel(expectedModel);
          expectModelsEqual(
            expectedModel,
            (await modelSet.document(expectedModel.identifier)).unsafeCoerce(),
          );
        }));
    },
  );

  for (const includeDeleted of [false, true]) {
    for (const queryType of ["All", "Identifiers", "MemberOfCorpus"] as const) {
      it(`documentStubs and documentsCount includeDeleted=${includeDeleted} queryType=${queryType}`, ({
        expect,
      }) =>
        withEmptyMutableModelSet(async (modelSet) => {
          const deleteModel = new Document({
            deleted: true,
            memberOfCorpus: stubify(
              syntheticTestData.corpora.withSyntheticDocuments,
            ),
          });
          const allModels = [
            ...Object.values(syntheticTestData.documents),
            deleteModel,
          ];
          for (const model of allModels) {
            await modelSet.addModel(model);
          }
          await modelSet.deleteModel(deleteModel);

          let expectedModels: readonly Document[];
          let query: DocumentQuery;
          switch (queryType) {
            case "All": {
              expectedModels = includeDeleted
                ? allModels
                : allModels.filter(
                    (document) =>
                      !document.identifier.equals(deleteModel.identifier),
                  );
              query = { includeDeleted, type: "All" };
              break;
            }
            case "Identifiers": {
              expectedModels = allModels;
              query = {
                documentIdentifiers: allModels.map(
                  (document) => document.identifier,
                ),
                // Always includeDeleted
                type: "Identifiers",
              };
              break;
            }
            case "MemberOfCorpus": {
              expectedModels = includeDeleted
                ? allModels
                : allModels.filter(
                    (document) =>
                      !document.identifier.equals(deleteModel.identifier),
                  );
              query = {
                corpusIdentifier:
                  syntheticTestData.corpora.withSyntheticDocuments.identifier,
                includeDeleted,
                type: "MemberOfCorpus",
              };
            }
          }

          const actualModelStubs = (
            await modelSet.documentStubs({
              limit: null,
              offset: 0,
              query,
            })
          ).unsafeCoerce();
          expectEqualResult(
            arrayEquals(
              expectedModels.map((model) => stubify(model)),
              actualModelStubs,
              (left, right) => left.equals(right),
            ),
          );

          expect(
            (await modelSet.documentsCount(query)).unsafeCoerce(),
          ).toStrictEqual(expectedModels.length);
        }));
    }
  }

  it("languageModelSpecification", async () => {
    const expectedModel = medlinePlusTestData.languageModelSpecification;
    expectModelsEqual(
      expectedModel,
      (
        await immutableModelSet.languageModelSpecification(
          expectedModel.identifier,
        )
      )
        .toMaybe()
        .extractNullable(),
    );
  });

  it("languageModelSpecifications", async ({ expect }) => {
    const actualModels = (
      await immutableModelSet.languageModelSpecifications()
    ).unsafeCoerce();
    expect(actualModels).not.toHaveLength(0);
    const expectedModel = medlinePlusTestData.languageModelSpecification;
    expect(
      actualModels.some((actualModel) =>
        actualModel.equals(expectedModel).extract(),
      ),
    ).toStrictEqual(true);
  });

  it("languageModelSpecificationStub", async () => {
    const expectedModel = stubify(
      medlinePlusTestData.languageModelSpecification,
    );
    expectModelsEqual(
      expectedModel,
      (
        await immutableModelSet.languageModelSpecificationStub(
          expectedModel.identifier,
        )
      )
        .toMaybe()
        .extractNullable(),
    );
  });

  it("languageModelSpecificationStubs", async ({ expect }) => {
    const actualModels = (
      await immutableModelSet.languageModelSpecificationStubs()
    ).unsafeCoerce();
    expect(actualModels).not.toHaveLength(0);
    const expectedModel = stubify(
      medlinePlusTestData.languageModelSpecification,
    );
    expect(
      actualModels.some((actualModel) =>
        actualModel.equals(expectedModel).extract(),
      ),
    ).toStrictEqual(true);
  });

  Object.entries(syntheticTestData.workflows).forEach(
    ([key, expectedModel]) => {
      it(`workflow ${key}`, async ({ expect }) =>
        withEmptyMutableModelSet(async (modelSet) => {
          expect((await modelSet.isEmpty()).unsafeCoerce()).toStrictEqual(true);
          await modelSet.addModel(expectedModel);
          expectModelsEqual(
            expectedModel,
            (await modelSet.workflow(expectedModel.identifier))
              .toMaybe()
              .extractNullable(),
          );
        }));
    },
  );

  it("workflow one of many", async ({ expect }) =>
    withEmptyMutableModelSet(async (modelSet) => {
      expect((await modelSet.isEmpty()).unsafeCoerce()).toStrictEqual(true);
      for (const model of Object.values(syntheticTestData.workflows)) {
        await modelSet.addModel(model);
      }
      for (const expectedModel of Object.values(syntheticTestData.workflows)) {
        expectModelsEqual(
          expectedModel,
          (await modelSet.workflow(expectedModel.identifier))
            .toMaybe()
            .extractNullable(),
        );
      }
    }));

  Object.entries(syntheticTestData.workflows).forEach(
    ([key, expectedModel]) => {
      it(`workflowStub ${key}`, async ({ expect }) =>
        withEmptyMutableModelSet(async (modelSet) => {
          expect((await modelSet.isEmpty()).unsafeCoerce()).toStrictEqual(true);
          await modelSet.addModel(expectedModel);
          expectModelsEqual(
            stubify(expectedModel),
            (await modelSet.workflowStub(expectedModel.identifier))
              .toMaybe()
              .extractNullable(),
          );
        }));
    },
  );

  for (const includeDeleted of [false, true]) {
    for (const queryType of ["All"] as const) {
      it(`workflowStubs includeDeleted=${includeDeleted} queryType=${queryType}`, () =>
        withEmptyMutableModelSet(async (modelSet) => {
          const deleteModel = new Workflow({
            deleted: true,
            label: "Delete workflow",
            steps: syntheticTestData.workflows.questionnaireStep.steps,
          });
          const allModels = [
            ...Object.values(syntheticTestData.workflows),
            deleteModel,
          ];
          for (const model of allModels) {
            await modelSet.addModel(model);
          }
          await modelSet.deleteModel(deleteModel);

          let expectedModels: Workflow[];
          let query: WorkflowQuery;
          switch (queryType) {
            case "All": {
              expectedModels = includeDeleted
                ? allModels
                : allModels.filter(
                    (workflow) =>
                      !workflow.identifier.equals(deleteModel.identifier),
                  );
              query = { includeDeleted, type: "All" };
              break;
            }
          }
          expectedModels = sortModelsByIdentifier(expectedModels);

          const actualModelStubs = (
            await modelSet.workflowStubs({
              query,
            })
          ).unsafeCoerce();
          expectEqualResult(
            arrayEquals(
              expectedModels.map((model) => stubify(model)),
              actualModelStubs,
              (left, right) => left.equals(right),
            ),
          );
        }));
    }
  }

  Object.entries(syntheticTestData.workflowExecutions).forEach(
    ([key, expectedModel]) => {
      it.skipIf(sparql)(`workflowExecution ${key}`, async ({ expect }) =>
        withEmptyMutableModelSet(async (modelSet) => {
          expect((await modelSet.isEmpty()).unsafeCoerce()).toStrictEqual(true);
          await modelSet.addModel(expectedModel);
          expectModelsEqual(
            expectedModel,
            (await modelSet.workflowExecution(expectedModel.identifier))
              .toMaybe()
              .extractNullable(),
          );
        }),
      );
    },
  );

  Object.entries(syntheticTestData.workflowExecutions).forEach(
    ([key, expectedModel]) => {
      it(`workflowExecutionStub ${key}`, async ({ expect }) =>
        withEmptyMutableModelSet(async (modelSet) => {
          expect((await modelSet.isEmpty()).unsafeCoerce()).toStrictEqual(true);
          await modelSet.addModel(expectedModel);
          expectModelsEqual(
            stubify(expectedModel),
            (await modelSet.workflowExecutionStub(expectedModel.identifier))
              .toMaybe()
              .extractNullable(),
          );
        }));
    },
  );

  it.skipIf(sparql)("workflowExecution one of many", async ({ expect }) =>
    withEmptyMutableModelSet(async (modelSet) => {
      expect((await modelSet.isEmpty()).unsafeCoerce()).toStrictEqual(true);
      for (const model of Object.values(syntheticTestData.workflowExecutions)) {
        await modelSet.addModel(model);
      }
      for (const expectedModel of Object.values(
        syntheticTestData.workflowExecutions,
      )) {
        expectModelsEqual(
          expectedModel,
          (await modelSet.workflowExecution(expectedModel.identifier))
            .toMaybe()
            .extractNullable(),
        );
      }
    }),
  );

  for (const queryType of ["All", "ClaimGenerator", "Workflow"] as const) {
    it.skipIf(sparql && queryType === "ClaimGenerator")(
      `workflowExecutionStubs queryType=${queryType}`,
      async ({ expect }) =>
        withEmptyMutableModelSet(async (modelSet) => {
          expect((await modelSet.isEmpty()).unsafeCoerce()).toStrictEqual(true);

          let expectedModels: readonly WorkflowExecution[];
          let query: WorkflowExecutionQuery;
          switch (queryType) {
            case "All": {
              expectedModels = Object.values(
                syntheticTestData.workflowExecutions,
              );
              for (const expectedModel of expectedModels) {
                await modelSet.addModel(expectedModel);
              }
              query = { type: "All" };
              break;
            }
            case "ClaimGenerator": {
              await modelSet.addModel(
                syntheticTestData.workflows.questionnaireStep,
              );
              // const tempModelSet = new RdfjsDatasetModelSet().addModelSync(
              //   syntheticTestData.workflowExecutions.questionnaireStep,
              // );
              // const ttl = await rdfEnvironment.serializers.serializeToString(
              //   tempModelSet.dataset,
              //   {
              //     format: "text/turtle",
              //   },
              // );
              // console.log(ttl);

              const expectedModel =
                syntheticTestData.workflowExecutions.questionnaireStep;
              expectedModels = [expectedModel];
              await modelSet.addModel(expectedModel);
              const expectedClaims: readonly Claim[] =
                expectedModel.subProcesses.stepExecutions[0].subProcesses.questionnaireAdministration
                  .unsafeCoerce()
                  .subProcesses.questionAdministrations.flatMap(
                    (questionAdministration) =>
                      (
                        questionAdministration.output as QuestionAdministrationOutput
                      ).answer.claims,
                  );
              expect(expectedClaims).toHaveLength(4);
              const expectedClaim = expectedClaims[0];
              query = {
                claimIdentifier: expectedClaim.identifier,
                type: "ClaimGenerator",
              };
              break;
            }
            case "Workflow": {
              // Add all workflows and executions just to make sure we get the right one.
              const allWorkflows = Object.values(
                syntheticTestData.workflows,
              ).slice(0, 2);
              const allWorkflowExecutions = Object.values(
                syntheticTestData.workflowExecutions,
              ).slice(0, 2);
              for (
                let workflowI = 0;
                workflowI < allWorkflows.length;
                workflowI++
              ) {
                const workflow = allWorkflows[workflowI];
                await modelSet.addModel(workflow);
                const workflowExecution = allWorkflowExecutions[workflowI];
                expect(
                  workflowExecution.input.workflow.identifier.equals(
                    workflow.identifier,
                  ),
                ).toStrictEqual(true);
                await modelSet.addModel(workflowExecution);
              }
              const expectedWorkflowExecution = allWorkflowExecutions[0];
              expectedModels = [expectedWorkflowExecution];
              const expectedWorkflow = (
                await modelSet.workflow(
                  expectedWorkflowExecution.input.workflow.identifier,
                )
              ).unsafeCoerce();
              query = {
                type: "Workflow",
                workflowIdentifier: expectedWorkflow.identifier,
              };
              break;
            }
          }

          const actualWorkflowExecutionStubs = (
            await modelSet.workflowExecutionStubs({ query })
          ).unsafeCoerce();
          expectEqualResult(
            arrayEquals(
              expectedModels.map((model) => stubify(model)),
              actualWorkflowExecutionStubs,
              (left, right) => left.equals(right),
            ),
          );
        }),
    );
  }
}
