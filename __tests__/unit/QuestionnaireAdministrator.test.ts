import { testData } from "@/__tests__/unit/data";
import { MockLanguageModel } from "@/__tests__/unit/language-models/MockLanguageModel";
import { questionnaireAdministrationAnswers } from "@/__tests__/unit/questionnaireAdministrationAnswers";
import { QuestionnaireAdministrator } from "@/lib/QuestionnaireAdministrator";
import { Exception, Question, Questionnaire } from "@/lib/models";
import { describe, it } from "vitest";

describe("QuestionnaireAdministrator", () => {
  const { document, modelSet } = testData.medlinePlus;
  const { instruction, questions } = testData.synthetic;

  const newSystemUnderTest = (
    invocationResults: (Error | string)[],
  ): {
    languageModel: MockLanguageModel;
    questionnaireAdministrator: QuestionnaireAdministrator;
  } => {
    const languageModel = new MockLanguageModel({
      invocationResults,
    });
    return {
      languageModel,
      questionnaireAdministrator: new QuestionnaireAdministrator({
        document,
        languageModel,
        modelSet,
      }),
    };
  };

  it("should stop on an error", async ({ expect }) => {
    const { questionnaireAdministrator: sut } = newSystemUnderTest([
      new Error("test error"),
    ]);
    const process = await sut.administer({
      questionnaire: new Questionnaire({
        members: [questions.dichotomous, questions.realValued],
      }),
    });
    expect(process.output.type).toStrictEqual("Exception");
    expect((process.output as Exception).message).toStrictEqual("test error");
    expect(process.subProcesses.questionAdministrations).toHaveLength(1);
    const questionAdministration =
      process.subProcesses.questionAdministrations[0];
    expect(questionAdministration.output.type).toStrictEqual("Exception");
    expect((questionAdministration.output as Exception).message).toStrictEqual(
      "test error",
    );
    expect(
      Question.equals(
        questionAdministration.input.question,
        questions.dichotomous,
      ).extract(),
    ).toStrictEqual(true);
    // Should never execute the second question
  });

  it("should add an instruction before a question", async ({ expect }) => {
    const { questionnaireAdministrator: sut, languageModel } =
      newSystemUnderTest([JSON.stringify({ answer: true })]);
    const process = await sut.administer({
      questionnaire: new Questionnaire({
        members: [instruction, questions.dichotomous],
      }),
    });
    expect(process.output.type).toStrictEqual(
      "QuestionnaireAdministrationOutput",
    );
    expect(languageModel.invocations).toHaveLength(1);
    const prompt = languageModel.invocations[0];
    expect(prompt.messages).toHaveLength(2);
    expect(prompt.messages[0].literalForm).toStrictEqual(
      instruction.promptMessage.literalForm,
    );
  });

  it("should return multiple answers", async ({ expect }) => {
    const { questionnaireAdministrator: sut } = newSystemUnderTest([
      JSON.stringify({ answer: true }),
      JSON.stringify({ answer: 1 }),
    ]);
    const process = await sut.administer({
      questionnaire: new Questionnaire({
        members: [instruction, questions.dichotomous, questions.realValued],
      }),
    });
    expect(process.output.type).toStrictEqual(
      "QuestionnaireAdministrationOutput",
    );
    const answers = questionnaireAdministrationAnswers(process);
    expect(answers).toHaveLength(2);
    const claims = answers.flatMap((answer) => answer.claims);
    expect(claims[0].object.type).toStrictEqual("BooleanValue");
    expect(claims[0].object.value).toStrictEqual(true);
    expect(claims[1].object.type).toStrictEqual("RealValue");
    expect(claims[1].object.value).toStrictEqual(1);
  });
});
