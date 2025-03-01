import { testData } from "@/__tests__/unit/data";
import { MockLanguageModel } from "@/__tests__/unit/language-models/MockLanguageModel";
import { expectEqualResult } from "@/__tests__/unit/models/expectEqualResult";
import { expectModelsEqual } from "@/__tests__/unit/models/expectModelsEqual";
import { expectTermsEqual } from "@/__tests__/unit/models/expectTermsEqual";
import { QuestionAdministrator } from "@/lib/QuestionAdministrator";
import {
  BooleanValue,
  CategoricalValue,
  Exception,
  Identifier,
  Question,
  QuestionAdministrationOutput,
  RealValue,
  TextValue,
  Value,
  stubify,
} from "@/lib/models";
import { describe, expect, it } from "vitest";

describe("QuestionAdministrator", () => {
  const { conceptStub, document, modelSet } = testData.medlinePlus;
  const { questions } = testData.synthetic;

  const newSystemUnderTest = (
    invocationResults: (Error | string)[],
  ): {
    languageModel: MockLanguageModel;
    questionAdministrator: QuestionAdministrator;
  } => {
    const languageModel = new MockLanguageModel({
      invocationResults,
    });
    return {
      languageModel,
      questionAdministrator: new QuestionAdministrator({
        document,
        languageModel,
        modelSet,
      }),
    };
  };

  it("should bubble up an error from the language model", async ({
    expect,
  }) => {
    const { questionAdministrator: sut } = newSystemUnderTest([
      new Error("test error"),
    ]);
    const process = await sut.administer({
      question: questions.dichotomous,
      promptMessageHistory: [],
    });
    expect(process.output.type).toStrictEqual("Exception");
    expect((process.output as Exception).message).toStrictEqual("test error");
  });

  it("should bubble up an error on value extraction", async ({ expect }) => {
    const { questionAdministrator: sut } = newSystemUnderTest([
      JSON.stringify({ x: 1, y: 2 }),
    ]);
    const process = await sut.administer({
      question: questions.realValued,
      promptMessageHistory: [],
    });
    expect(process.output.type).toStrictEqual("Exception");
    expect((process.output as Exception).message).toMatch(
      /^JSON object with multiple members/,
    );
  });

  const testAnswer = async ({
    completionMessage,
    expectedValue,
    question,
  }: {
    completionMessage: string;
    expectedValue: Value;
    question: Question;
  }): Promise<void> => {
    const { questionAdministrator: sut, languageModel } = newSystemUnderTest([
      completionMessage,
    ]);

    const process = await sut.administer({
      question,
      promptMessageHistory: [],
    });

    expect(languageModel.invocations).toHaveLength(1);
    const prompt = languageModel.invocations[0];
    expect(prompt.messages).not.toHaveLength(0);

    // Input
    expectModelsEqual(process.input.document, stubify(document));
    expectEqualResult(Question.equals(process.input.question, question));
    expectTermsEqual(
      MockLanguageModel.IDENTIFIER,
      process.input.languageModel.identifier,
    );

    // Output
    expect(process.output.type).toStrictEqual("QuestionAdministrationOutput");
    const claims = (process.output as QuestionAdministrationOutput).answer
      .claims;
    expect(claims).toHaveLength(1);
    const claim = claims[0];
    expectTermsEqual(question.path, claim.predicate);
    expectEqualResult(Value.equals(claim.object, expectedValue));
    expectTermsEqual(document.identifier, claim.subject);

    // Sub-processes
    expect(process.subProcesses.languageModelInvocation.isJust()).toStrictEqual(
      true,
    );
    expect(process.subProcesses.valueExtraction.isJust()).toStrictEqual(true);
  };

  it("should answer a dichotomous question", async () => {
    await testAnswer({
      completionMessage: JSON.stringify({ answer: true }),
      expectedValue: new BooleanValue({ value: true }),
      question: questions.dichotomous,
    });
  });

  it("should answer a categorical question", async () => {
    await testAnswer({
      completionMessage: JSON.stringify({
        answer: [Identifier.toString(conceptStub.identifier)],
      }),
      expectedValue: new CategoricalValue({
        value: conceptStub,
      }),
      question: questions.categorical,
    });
  });

  it("should answer a real-valued question", async () => {
    await testAnswer({
      completionMessage: JSON.stringify({
        answer: [1],
      }),
      expectedValue: new RealValue({
        value: 1,
      }),
      question: questions.realValued,
    });
  });

  it("should answer a text question", async () => {
    await testAnswer({
      completionMessage: JSON.stringify({
        answer: ["test"],
      }),
      expectedValue: new TextValue({
        value: "test",
      }),
      question: questions.text,
    });
  });
});
