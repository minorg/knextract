import { QuestionAdministrator } from "@/lib/QuestionAdministrator";
import { LanguageModel } from "@/lib/language-models";
import {
  Answer,
  Document,
  DocumentStub,
  Exception,
  LanguageModelInvocationOutput,
  LanguageModelSpecificationStub,
  ModelSet,
  PromptMessage,
  QuestionAdministration,
  Questionnaire,
  QuestionnaireAdministration,
  QuestionnaireAdministrationInput,
  QuestionnaireAdministrationOutput,
  QuestionnaireAdministrationSubProcesses,
  stubify,
} from "@/lib/models";
import { formatPromptMessageTemplate } from "@/lib/utilities/server";

export class QuestionnaireAdministrator {
  private readonly document: Document;
  private readonly documentStub: DocumentStub;
  private readonly languageModelSpecificationStub: LanguageModelSpecificationStub;
  private readonly modelSet: ModelSet;
  private readonly questionAdministrator: QuestionAdministrator;

  constructor({
    document,
    languageModel,
    modelSet,
  }: {
    document: Document;
    languageModel: LanguageModel;
    modelSet: ModelSet;
  }) {
    this.document = document;
    this.documentStub = stubify(document);
    this.languageModelSpecificationStub = stubify(languageModel.specification);
    this.modelSet = modelSet;
    this.questionAdministrator = new QuestionAdministrator({
      document,
      languageModel,
      modelSet,
    });
  }

  async administer({
    questionnaire,
  }: {
    questionnaire: Questionnaire;
  }): Promise<QuestionnaireAdministration> {
    const startedAtTime = new Date();

    const input = new QuestionnaireAdministrationInput({
      document: this.documentStub,
      languageModel: this.languageModelSpecificationStub,
      questionnaire,
    });

    let answers: Answer[] = [];
    const questionAdministrations: QuestionAdministration[] = [];
    let promptMessageHistory: PromptMessage[] = [];
    for (const member of questionnaire.members) {
      if (member.type === "Instruction") {
        switch (member.promptMessage.type) {
          case "CompletionMessage":
          case "PromptMessage":
            promptMessageHistory.push(member.promptMessage);
            break;
          case "PromptMessageTemplate": {
            const ambientInputValues: Record<string, any> = {};
            ambientInputValues["document"] = {};
            for (const textualEntity of this.document.textualEntities) {
              switch (textualEntity.encodingType.value) {
                case "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextHtml":
                  ambientInputValues["document"]["html"] =
                    textualEntity.literalForm;
                  break;
                case "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextPlain":
                  ambientInputValues["document"]["text"] =
                    textualEntity.literalForm;
                  break;
              }
            }
            const promptMessage = await formatPromptMessageTemplate({
              ambientInputValues,
              modelSet: this.modelSet,
              promptMessageTemplate: member.promptMessage,
            });
            if (promptMessage.isLeft()) {
              // Stop and exit on the first exception
              return new QuestionnaireAdministration({
                endedAtTime: new Date(),
                input,
                output: new Exception({
                  message: (promptMessage.extract() as Error).message,
                }),
                startedAtTime,
                subProcesses: new QuestionnaireAdministrationSubProcesses({
                  questionAdministrations,
                }),
              });
            }
            promptMessageHistory.push(promptMessage.unsafeCoerce());
            break;
          }
        }
        continue;
      }

      const questionAdministration =
        await this.questionAdministrator.administer({
          question: member,
          promptMessageHistory,
        });

      questionAdministrations.push(questionAdministration);

      if (questionAdministration.output.type === "Exception") {
        // Stop and exit on the first exception
        return new QuestionnaireAdministration({
          endedAtTime: new Date(),
          input,
          output: questionAdministration.output,
          startedAtTime,
          subProcesses: new QuestionnaireAdministrationSubProcesses({
            questionAdministrations,
          }),
        });
      }

      answers = answers.concat(questionAdministration.output.answer);

      // Update the prompt message history
      const languageModelInvocation =
        questionAdministration.subProcesses.languageModelInvocation.unsafeCoerce();
      promptMessageHistory =
        languageModelInvocation.input.prompt.messages.concat(
          (languageModelInvocation.output as LanguageModelInvocationOutput)
            .completionMessage,
        );
    }

    return new QuestionnaireAdministration({
      endedAtTime: new Date(),
      input,
      output: new QuestionnaireAdministrationOutput({
        answers,
      }),
      startedAtTime,
      subProcesses: new QuestionnaireAdministrationSubProcesses({
        questionAdministrations,
      }),
    });
  }
}
