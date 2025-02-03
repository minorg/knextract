import { ValueExtractor } from "@/lib/ValueExtractor";
import { LanguageModel } from "@/lib/language-models";
import {
  Answer,
  Claim,
  CompletionMessage,
  Document,
  DocumentStub,
  Exception,
  LanguageModelInvocation,
  LanguageModelInvocationInput,
  LanguageModelInvocationOutput,
  LanguageModelSpecificationStub,
  ModelSet,
  Prompt,
  PromptConstruction,
  PromptConstructionInput,
  PromptConstructionOutput,
  PromptMessage,
  Question,
  QuestionAdministration,
  QuestionAdministrationInput,
  QuestionAdministrationOutput,
  QuestionAdministrationSubProcesses,
  ValueExtraction,
  ValueExtractionInput,
  ValueExtractionOutput,
  kosLabels,
  selectConcepts,
  stubify,
} from "@/lib/models";
import {
  formatPromptMessageTemplate,
  formatPromptTemplate,
} from "@/lib/utilities/server";
import { Either, Maybe } from "purify-ts";

export class QuestionAdministrator {
  private readonly document: Document;
  private readonly documentStub: DocumentStub;
  private readonly languageModel: LanguageModel;
  private readonly languageModelSpecificationStub: LanguageModelSpecificationStub;
  private readonly modelSet: ModelSet;
  private readonly valueExtractor: ValueExtractor;

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
    this.languageModel = languageModel;
    this.languageModelSpecificationStub = stubify(languageModel.specification);
    this.modelSet = modelSet;
    this.valueExtractor = new ValueExtractor({ modelSet: Maybe.of(modelSet) });
  }

  async administer({
    question,
    promptMessageHistory,
  }: {
    promptMessageHistory: readonly PromptMessage[];
    question: Question;
  }): Promise<QuestionAdministration> {
    const startedAtTime = new Date();

    const input = new QuestionAdministrationInput({
      document: this.documentStub,
      languageModel: this.languageModelSpecificationStub,
      question,
    });

    const promptConstruction = await this.constructPrompt({
      promptMessageHistory,
      question,
    });
    if (promptConstruction.output.type === "Exception") {
      return new QuestionAdministration({
        endedAtTime: new Date(),
        input,
        output: promptConstruction.output,
        startedAtTime,
        subProcesses: new QuestionAdministrationSubProcesses({
          promptConstruction,
        }),
      });
    }
    const prompt = promptConstruction.output.prompt;

    const languageModelInvocation = await this.invokeLanguageModel(prompt);

    if (languageModelInvocation.output.type === "Exception") {
      return new QuestionAdministration({
        endedAtTime: new Date(),
        input,
        output: languageModelInvocation.output,
        startedAtTime,
        subProcesses: new QuestionAdministrationSubProcesses({
          languageModelInvocation,
        }),
      });
    }

    const valueExtraction = await this.extractValues({
      completionMessage: languageModelInvocation.output.completionMessage,
      question,
    });
    if (valueExtraction.output.type === "Exception") {
      return new QuestionAdministration({
        endedAtTime: new Date(),
        input: input,
        output: valueExtraction.output,
        startedAtTime,
        subProcesses: new QuestionAdministrationSubProcesses({
          languageModelInvocation,
          valueExtraction,
        }),
      });
    }
    const values = valueExtraction.output.values;

    return new QuestionAdministration({
      endedAtTime: new Date(),
      input,
      output: new QuestionAdministrationOutput({
        answer: new Answer({
          claims: values.map(
            (value) =>
              new Claim({
                predicate: question.path,
                subject: this.document.identifier,
                object: value,
              }),
          ),
        }),
      }),
      startedAtTime,
      subProcesses: new QuestionAdministrationSubProcesses({
        languageModelInvocation,
        valueExtraction,
      }),
    });
  }

  private async constructPrompt({
    promptMessageHistory,
    question,
  }: {
    promptMessageHistory: readonly PromptMessage[];
    question: Question;
  }): Promise<PromptConstruction> {
    const startedAtTime = new Date();
    let input: PromptConstructionInput = new PromptConstructionInput({
      document: this.documentStub,
      question,
    });

    switch (question.promptTemplate.type) {
      case "Prompt":
        return new PromptConstruction({
          endedAtTime: new Date(),
          input,
          output: new PromptConstructionOutput({
            prompt: question.promptTemplate, // Use the entire prompt as-is
          }),
          startedAtTime,
        });
      case "CompletionMessage":
      case "PromptMessage":
        return new PromptConstruction({
          endedAtTime: new Date(),
          input,
          output: new PromptConstructionOutput({
            // Append the PromptMessage as-is to the message history and use it
            prompt: new Prompt({
              messages: promptMessageHistory.concat(question.promptTemplate),
            }),
          }),
          startedAtTime,
        });
      default:
        break; // Fall through
    }

    // Templates

    const ambientInputValues: Record<string, any> = {};

    ambientInputValues["document"] = {};
    for (const textualEntity of this.document.textualEntities) {
      switch (textualEntity.encodingType.value) {
        case "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextHtml":
          ambientInputValues["document"]["html"] = textualEntity.literalForm;
          break;
        case "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextPlain":
          ambientInputValues["document"]["text"] = textualEntity.literalForm;
          break;
      }
    }

    switch (question.type) {
      case "CategoricalQuestion": {
        const selectedConceptStubsEither = await selectConcepts({
          conceptSelector: question.conceptSelector,
          modelSet: this.modelSet,
        });
        if (selectedConceptStubsEither.isLeft()) {
          return new PromptConstruction({
            endedAtTime: new Date(),
            input,
            output: new Exception({
              message: (selectedConceptStubsEither.extract() as Error).message,
            }),
            startedAtTime,
          });
        }
        const selectedConceptStubs = selectedConceptStubsEither.unsafeCoerce();

        input = new PromptConstructionInput({
          concepts: selectedConceptStubs,
          document: this.documentStub,
          question,
        });

        const selectedConceptEithers = await this.modelSet.concepts(
          selectedConceptStubs.map((_) => _.identifier),
        );

        const conceptJsonObjects: Record<string, any>[] = [];
        for (const selectedConceptEither of selectedConceptEithers) {
          if (selectedConceptEither.isLeft()) {
            return new PromptConstruction({
              endedAtTime: new Date(),
              input,
              output: new Exception({
                message: (selectedConceptEither.extract() as Error).message,
              }),
              startedAtTime,
            });
          }
          const selectedConcept = selectedConceptEither.unsafeCoerce();

          const conceptJsonObject: Record<string, any> = {
            number: conceptJsonObjects.length + 1,
          };

          if (selectedConcept.definition.length > 0) {
            conceptJsonObject["definition"] =
              selectedConcept.definition[0].value.trim();
          }

          kosLabels(selectedConcept).preferred.ifJust((prefLabel) => {
            for (const literalForm of prefLabel.literalForm) {
              conceptJsonObject["label"] = literalForm.value.trim();
              break;
            }
          });

          if (selectedConcept.scopeNote.length > 0) {
            conceptJsonObject["scopeNote"] =
              selectedConcept.scopeNote[0].value.trim();
            break;
          }

          conceptJsonObjects.push(conceptJsonObject);
        }
        ambientInputValues["concepts"] = conceptJsonObjects;
      }
    }

    let prompt: Either<Error, Prompt>;
    switch (question.promptTemplate.type) {
      case "PromptMessageTemplate": {
        prompt = (
          await formatPromptMessageTemplate({
            ambientInputValues,
            modelSet: this.modelSet,
            promptMessageTemplate: question.promptTemplate,
          })
        ).map(
          (promptMessage) =>
            new Prompt({
              messages: promptMessageHistory.concat(promptMessage),
            }),
        );
        break;
      }
      case "PromptTemplate":
        prompt = await formatPromptTemplate({
          ambientInputValues,
          modelSet: this.modelSet,
          promptTemplate: question.promptTemplate,
        });
        break;
    }

    return new PromptConstruction({
      endedAtTime: new Date(),
      input,
      output: prompt
        .mapLeft(
          (error) =>
            new Exception({
              message: error.message,
            }),
        )
        .map((prompt) => new PromptConstructionOutput({ prompt }))
        .extract(),
      startedAtTime,
    });
  }

  private async extractValues({
    completionMessage,
    question,
  }: {
    completionMessage: CompletionMessage;
    question: Question;
  }): Promise<ValueExtraction> {
    const startedAtTime = new Date();
    const input = new ValueExtractionInput({ completionMessage });
    return (
      await this.valueExtractor.extractValues(completionMessage, { question })
    )
      .mapLeft(
        (error) =>
          new ValueExtraction({
            endedAtTime: new Date(),
            input,
            output: new Exception({ message: error.message }),
            startedAtTime,
          }),
      )
      .map(
        (values) =>
          new ValueExtraction({
            endedAtTime: new Date(),
            input,
            output: new ValueExtractionOutput({ values }),
            startedAtTime,
          }),
      )
      .extract();
  }

  private async invokeLanguageModel(
    prompt: Prompt,
  ): Promise<LanguageModelInvocation> {
    const startedAtTime = new Date();

    const result = await this.languageModel.invoke(prompt);
    return new LanguageModelInvocation({
      endedAtTime: new Date(),
      input: new LanguageModelInvocationInput({
        languageModel: this.languageModelSpecificationStub,
        prompt,
      }),
      output: result
        .map(
          (completionMessage) =>
            new LanguageModelInvocationOutput({ completionMessage }),
        )
        .mapLeft((error) => new Exception({ message: error.message }))
        .extract(),
      startedAtTime,
    });
  }
}
