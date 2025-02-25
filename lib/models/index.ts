/**
 * Re-export models from a single file.
 *
 * All code that uses models should import from this file (or a shorthand like @/lib/models).
 *
 * See this article for rationale:
 * https://medium.com/visual-development/how-to-fix-nasty-circular-dependency-issues-once-and-for-all-in-javascript-typescript-a04c987cf0de
 *
 * "The reason that this solves our problem is: we now have full control over the module loading order. Whatever the import order in internal.js is, will be our module loading order."
 *
 * This file is the equivalent of internal.js in that article.
 */

// Bring iterator-helpers-polyfill into the global namespace
import "iterator-helpers-polyfill";

// Re-export some library types so Knextract code doesn't have library imports everywhere
// kos-kit
export {
  Concept,
  ConceptScheme,
  KosResource,
  Label as KosLabel,
  ConceptStub,
  ConceptSchemeStub,
  LabelProperty as KosLabelProperty,
  NoteProperty as KosNoteProperty,
  noteProperties as kosNoteProperties,
  SemanticRelationProperty as KosSemanticRelationProperty,
  semanticRelationProperties as kosSemanticRelationProperties,
  labels as kosResourceLabels,
  LabelStub as KosLabelStub,
  notes as kosResourceNotes,
  semanticRelations as conceptSemanticRelations,
} from "@kos-kit/models";
export type {
  ConceptQuery,
  ConceptSchemeQuery,
  Kos,
  LanguageTag,
} from "@kos-kit/models";

// Re-export generated classes before handwritten classes
export {
  Answer,
  arrayEquals,
  BooleanValue,
  CategoricalQuestion,
  CategoricalValue,
  Claim,
  ClaimProperty,
  CompletionMessage,
  ConceptSchemeConceptSelector,
  ConceptSchemeTopConceptSelector,
  ConceptSelector,
  Corpus,
  CorpusDeletion,
  CorpusDeletionInput,
  CorpusStub,
  DichotomousQuestion,
  Document,
  DocumentClaims,
  DocumentDeletion,
  DocumentDeletionInput,
  DocumentStub,
  DocumentTitle,
  EnumeratedConceptSelector,
  EqualsResult,
  EvaluatedClaims,
  Exception,
  Image,
  Instruction,
  LanguageModelCreator,
  LanguageModelFamily,
  LanguageModelInvocation,
  LanguageModelInvocationInput,
  LanguageModelInvocationOutput,
  LanguageModelSpecification,
  LanguageModelSpecificationStub,
  NarrowerConceptSelector,
  NarrowerTransitiveConceptSelector,
  PostWorkflowExecutionEvent,
  PostWorkflowExecutionEventPayload,
  PostWorkflowStepExecutionEvent,
  PreWorkflowExecutionEvent,
  PreWorkflowStepExecutionEvent,
  Process,
  ProcessInput,
  ProcessOutput,
  ProcessSubProcesses,
  Prompt,
  PromptConstruction,
  PromptConstructionInput,
  PromptConstructionOutput,
  PromptInputValue,
  PromptLiteralInputValue,
  PromptMessage,
  PromptMessageTemplate,
  PromptSparqlSelectInputValue,
  PromptTemplate,
  PromptTemplateLike,
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
  TextualEntity,
  TextValue,
  TruePositiveClaimPair,
  UnevaluatedClaims,
  Value,
  ValueExtraction,
  ValueExtractionInput,
  ValueExtractionOutput,
  Workflow,
  WorkflowDeletion,
  WorkflowDeletionInput,
  WorkflowExecution,
  WorkflowExecutionEvent,
  WorkflowExecutionInput,
  WorkflowExecutionOutput,
  WorkflowExecutionStub,
  WorkflowExecutionSubProcesses,
  WorkflowQuestionnaireStep,
  WorkflowQuestionnaireStepExecution,
  WorkflowQuestionnaireStepExecutionInput,
  WorkflowQuestionnaireStepExecutionOutput,
  WorkflowQuestionnaireStepExecutionSubProcesses,
  WorkflowStep,
  WorkflowStepExecution,
  WorkflowStepExecutionInput,
  WorkflowStub,
} from "./models.shaclmate.generated";

// Re-export handwritten code
export * from "./ClaimQuery";
export * from "./ClientConfiguration";
export * from "./CorpusQuery";
export * from "../components/displayLabel";
export * from "./DocumentQuery";
export * from "./evaluateClaims";
export * from "./Identifier";
export * from "./Locale";
export * from "./ModelSet";
export * from "./selectConcepts";
export * from "./sortModelsByIdentifier";
export * from "./stubify";
export * from "./WorkflowQuery";
export * from "./WorkflowExecutionQuery";
