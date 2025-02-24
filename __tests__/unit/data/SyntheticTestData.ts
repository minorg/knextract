import { RdfModelSetTestData } from "@/__tests__/unit/data/RdfModelSetTestData";
import {
  Answer,
  BooleanValue,
  CategoricalQuestion,
  CategoricalValue,
  Claim,
  ClaimProperty,
  CompletionMessage,
  ConceptSchemeConceptSelector,
  ConceptSchemeTopConceptSelector,
  Corpus,
  DichotomousQuestion,
  Document,
  DocumentTitle,
  EnumeratedConceptSelector,
  Exception,
  Instruction,
  NarrowerConceptSelector,
  NarrowerTransitiveConceptSelector,
  Prompt,
  PromptLiteralInputValue,
  PromptMessage,
  PromptMessageTemplate,
  PromptSparqlSelectInputValue,
  PromptTemplate,
  Question,
  QuestionAdministration,
  QuestionAdministrationInput,
  QuestionAdministrationOutput,
  QuestionAdministrationSubProcesses,
  Questionnaire,
  QuestionnaireAdministration,
  QuestionnaireAdministrationInput,
  QuestionnaireAdministrationOutput,
  QuestionnaireAdministrationSubProcesses,
  RealValue,
  RealValuedQuestion,
  TextQuestion,
  TextValue,
  TextualEntity,
  Value,
  Workflow,
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
  stubify,
} from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { dataFactory } from "@/lib/rdfEnvironment";
import { formatPromptTemplate } from "@/lib/utilities/server";
import { dcterms } from "@/lib/vocabularies";
import { Maybe } from "purify-ts";

export interface SyntheticTestData {
  readonly claimProperties: readonly ClaimProperty[];
  readonly claims: readonly Claim[];
  readonly completionMessage: CompletionMessage;
  readonly conceptSelectors: {
    readonly conceptSchemeConceptSelector: ConceptSchemeConceptSelector;
    readonly conceptSchemeTopConceptSelector: ConceptSchemeTopConceptSelector;
    readonly enumeratedConceptSelector: EnumeratedConceptSelector;
    readonly narrowerConceptSelector: NarrowerConceptSelector;
    readonly narrowerTransitiveConceptSelector: NarrowerTransitiveConceptSelector;
  };
  readonly corpora: {
    readonly mutable: Corpus;
    readonly withSyntheticDocuments: Corpus;
    readonly withMedlinePlusDocuments: Corpus;
  };
  readonly documents: {
    readonly htmlOnly: Document;
    readonly mutableOnly: Document;
    readonly textOnly: Document;
    readonly titleOnly: Document;
    readonly urlOnly: Document;
  };
  readonly exception: Exception;
  readonly instruction: Instruction;
  readonly prompt: Prompt;
  readonly promptTemplate: PromptTemplate;
  readonly questionnaire: Questionnaire;
  readonly questions: {
    readonly dichotomous: DichotomousQuestion;
    readonly categorical: CategoricalQuestion;
    readonly realValued: RealValuedQuestion;
    readonly text: TextQuestion;
  };
  readonly workflowExecutions: {
    [Name in keyof SyntheticTestData["workflows"]]: WorkflowExecution;
  };
  readonly workflows: {
    readonly exception: Workflow;
    readonly questionnaireStep: Workflow;
  };
}

export namespace SyntheticTestData {
  export async function create({
    claims,
    conceptSchemeStub,
    conceptStub,
    documentStub,
    languageModelSpecification,
  }: RdfModelSetTestData): Promise<SyntheticTestData> {
    const clock = { nextDate: new Date(0) };
    const nextDate = () => {
      const nextDate_ = clock.nextDate;
      clock.nextDate = new Date(nextDate_.getTime() + 60 * 1000);
      return nextDate_;
    };
    const nextProcessTimes = () => {
      const startedAtTime = nextDate();
      const endedAtTime = nextDate();
      return {
        startedAtTime,
        endedAtTime: Maybe.of(endedAtTime),
      };
    };

    const exception = new Exception({
      message: "Test exception",
    });

    const instruction = new Instruction({
      promptMessage: new PromptMessage({ literalForm: "Instruction text" }),
    });

    const languageModelSpecificationStub = stubify(languageModelSpecification);

    const promptTemplate = new PromptTemplate({
      inputValues: [
        new PromptLiteralInputValue({
          literalForm: "promptvalue",
          variable: "key",
        }),
      ],
      messageTemplates: [
        new PromptMessageTemplate({
          literalForm: "System message",
          role: "http://purl.archive.org/purl/knextract/cbox#_Role_System",
        }),
        new PromptMessageTemplate({
          literalForm: "Prompt-level literal input value: {{key}}",
          role: "http://purl.archive.org/purl/knextract/cbox#_Role_Human",
        }),
        new PromptMessageTemplate({
          inputValues: [
            new PromptLiteralInputValue({
              literalForm: "messagevalue",
              variable: "key",
            }),
          ],
          literalForm: "Message-level literal input value: {{key}}",
          role: "http://purl.archive.org/purl/knextract/cbox#_Role_Human",
        }),
        new PromptMessageTemplate({
          inputValues: [
            new PromptSparqlSelectInputValue({
              sparqlSelect: "SELECT DISTINCT ?s WHERE { ?s ?p ?o }",
            }),
          ],
          literalForm: "Message-level SPARQL SELECT input value: {{key}}",
          role: "http://purl.archive.org/purl/knextract/cbox#_Role_Human",
        }),
        new PromptMessageTemplate({
          literalForm: "Here is concepts_json:\n{{concepts_json}}",
          role: "http://purl.archive.org/purl/knextract/cbox#_Role_Human",
        }),
      ],
    });

    const prompt = (
      await formatPromptTemplate({
        ambientInputValues: { concepts_json: "" },
        modelSet: new RdfjsDatasetModelSet(),
        promptTemplate,
      })
    ).unsafeCoerce();

    const questions: SyntheticTestData["questions"] = {
      dichotomous: new DichotomousQuestion({
        path: dataFactory.namedNode("http://example.com/question/dichotomous"),
        promptTemplate: new PromptMessage({
          literalForm: "Dichotomous question",
        }),
      }),
      categorical: new CategoricalQuestion({
        conceptSelector: new ConceptSchemeConceptSelector({
          conceptScheme: conceptSchemeStub,
        }),
        path: dataFactory.namedNode("http://example.com/question/categorical"),
        promptTemplate: new PromptMessage({
          literalForm: "Categorical question",
        }),
      }),
      realValued: new RealValuedQuestion({
        path: dataFactory.namedNode("http://example.com/question/real-valued"),
        promptTemplate: new PromptMessage({
          literalForm: "Real-valued question",
        }),
      }),
      text: new TextQuestion({
        path: dataFactory.namedNode("http://example.com/question/text"),
        promptTemplate: new PromptMessage({
          literalForm: "Text question",
        }),
      }),
    };

    const questionnaire = new Questionnaire({
      members: [instruction, ...Object.values(questions)],
    });

    const createQuestionAdministration = ({
      exception,
      question,
    }: {
      exception?: Exception;
      question: Question;
    }) => {
      let value: Value;
      switch (question.type) {
        case "CategoricalQuestion":
          value = new CategoricalValue({ value: conceptStub });
          break;
        case "DichotomousQuestion":
          value = new BooleanValue({ value: true });
          break;
        case "RealValuedQuestion":
          value = new RealValue({ value: 1 });
          break;
        case "TextQuestion":
          value = new TextValue({ value: "Test" });
          break;
      }

      return new QuestionAdministration({
        ...nextProcessTimes(),
        input: new QuestionAdministrationInput({
          document: documentStub,
          languageModel: languageModelSpecificationStub,
          question,
        }),
        output:
          exception ??
          new QuestionAdministrationOutput({
            answer: new Answer({
              claims: [
                new Claim({
                  object: value,
                  predicate: question.path,
                  subject: documentStub.identifier,
                }),
              ],
            }),
          }),
        subProcesses: new QuestionAdministrationSubProcesses({}),
      });
    };

    const createQuestionnaireAdministration = ({
      exception,
      questionnaire,
    }: {
      exception?: Exception;
      questionnaire: Questionnaire;
    }): QuestionnaireAdministration => {
      const questionAdministrations = questionnaire.members.flatMap(
        (member, memberI) =>
          member.type !== "Instruction"
            ? [
                createQuestionAdministration({
                  exception: exception && memberI === 0 ? exception : undefined,
                  question: member,
                }),
              ]
            : [],
      );
      return new QuestionnaireAdministration({
        ...nextProcessTimes(),
        input: new QuestionnaireAdministrationInput({
          document: documentStub,
          languageModel: languageModelSpecificationStub,
          questionnaire,
        }),
        output: exception ?? new QuestionnaireAdministrationOutput({}),
        subProcesses: new QuestionnaireAdministrationSubProcesses({
          questionAdministrations,
        }),
      });
    };

    const createWorkflowStepExecution = ({
      exception,
      step,
    }: {
      exception?: Exception;
      step: WorkflowStep;
    }): WorkflowStepExecution => {
      switch (step.type) {
        case "WorkflowQuestionnaireStep": {
          const questionnaireAdministration = createQuestionnaireAdministration(
            {
              exception,
              questionnaire: step.questionnaire,
            },
          );
          return new WorkflowQuestionnaireStepExecution({
            ...nextProcessTimes(),
            input: new WorkflowQuestionnaireStepExecutionInput({
              document: documentStub,
              step: step,
            }),
            output:
              questionnaireAdministration.output.type === "Exception"
                ? questionnaireAdministration.output
                : new WorkflowQuestionnaireStepExecutionOutput({}),
            subProcesses: new WorkflowQuestionnaireStepExecutionSubProcesses({
              questionnaireAdministration,
            }),
          });
        }
      }
    };

    const createWorkflowExecution = ({
      exception,
      workflow,
    }: {
      exception?: Exception;
      workflow: Workflow;
    }): WorkflowExecution =>
      new WorkflowExecution({
        ...nextProcessTimes(),
        input: new WorkflowExecutionInput({
          document: documentStub,
          workflow: stubify(workflow),
        }),
        output: new WorkflowExecutionOutput({}),
        subProcesses: new WorkflowExecutionSubProcesses({
          stepExecutions: workflow.steps.map((step) =>
            createWorkflowStepExecution({ exception, step }),
          ),
        }),
      });

    const workflows = {
      exception: new Workflow({
        label: "exception",
        steps: [
          new WorkflowQuestionnaireStep({
            languageModel: languageModelSpecificationStub,
            questionnaire,
          }),
        ],
      }),
      questionnaireStep: new Workflow({
        label: "exception",
        steps: [
          new WorkflowQuestionnaireStep({
            languageModel: languageModelSpecificationStub,
            questionnaire,
          }),
        ],
      }),
    };

    const syntheticDocumentCorpus = new Corpus({
      identifier: dataFactory.namedNode(
        "http://example.com/corpus/with-synthetic-documents",
      ),
      label: "Test corpus (with synthetic documents)",
      mutable: true,
    });
    const syntheticDocumentCorpusStub = stubify(syntheticDocumentCorpus);

    return {
      claimProperties: [
        new ClaimProperty({
          identifier: dcterms.subject,
          labels: [dataFactory.literal("subject")],
        }),
      ],
      claims,
      completionMessage: new CompletionMessage({
        literalForm: "Completion message",
        role: "http://purl.archive.org/purl/knextract/cbox#_Role_AI",
      }),
      conceptSelectors: {
        conceptSchemeConceptSelector: new ConceptSchemeConceptSelector({
          conceptScheme: conceptSchemeStub,
        }),
        conceptSchemeTopConceptSelector: new ConceptSchemeTopConceptSelector({
          conceptScheme: conceptSchemeStub,
        }),
        enumeratedConceptSelector: new EnumeratedConceptSelector({
          concepts: [conceptStub],
        }),
        narrowerConceptSelector: new NarrowerConceptSelector({
          focusConcept: conceptStub,
        }),
        narrowerTransitiveConceptSelector:
          new NarrowerTransitiveConceptSelector({
            focusConcept: conceptStub,
          }),
      },
      corpora: {
        mutable: new Corpus({
          identifier: dataFactory.namedNode(
            "http://example.com/corpus/mutable",
          ),
          label: "Test corpus (mutable)",
          mutable: true,
        }),
        withMedlinePlusDocuments: new Corpus({
          identifier: dataFactory.namedNode(
            "http://example.com/corpus/with-medline-plus-documents",
          ),
          label: "Test corpus (with Medline Plus documents)",
        }),
        withSyntheticDocuments: syntheticDocumentCorpus,
      },
      documents: {
        htmlOnly: new Document({
          identifier: dataFactory.namedNode(
            "http://example.com/document/html-only",
          ),
          memberOfCorpus: syntheticDocumentCorpusStub,
          mutable: true,
          textualEntities: [
            new TextualEntity({
              encodingType:
                "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextHtml",
              literalForm: "<div></div>",
            }),
          ],
        }),
        mutableOnly: new Document({
          identifier: dataFactory.namedNode(
            "http://example.com/document/mutable-only",
          ),
          memberOfCorpus: syntheticDocumentCorpusStub,
          mutable: true,
        }),
        textOnly: new Document({
          identifier: dataFactory.namedNode(
            "http://example.com/document/text-only",
          ),
          memberOfCorpus: syntheticDocumentCorpusStub,
          mutable: true,
          textualEntities: [
            new TextualEntity({
              encodingType:
                "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextHtml",
              literalForm: "testtext",
            }),
          ],
        }),
        titleOnly: new Document({
          identifier: dataFactory.namedNode(
            "http://example.com/document/title-only",
          ),
          memberOfCorpus: syntheticDocumentCorpusStub,
          mutable: true,
          title: new DocumentTitle({
            encodingType:
              "http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextPlain",
            literalForm: "testtitle",
          }),
        }),
        urlOnly: new Document({
          identifier: dataFactory.namedNode(
            "http://example.com/document/url-only",
          ),
          memberOfCorpus: syntheticDocumentCorpusStub,
          mutable: true,
          url: "http://example.com",
        }),
      },
      exception,
      instruction,
      prompt,
      promptTemplate,
      questionnaire,
      questions,
      workflows,
      workflowExecutions: {
        exception: createWorkflowExecution({
          exception,
          workflow: workflows.exception,
        }),
        questionnaireStep: createWorkflowExecution({
          workflow: workflows.questionnaireStep,
        }),
      },
    };
  }
}
