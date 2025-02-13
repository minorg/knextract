import {
  Concept,
  ConceptScheme,
  ConceptSchemeStub,
  ConceptStub,
  Corpus,
  CorpusStub,
  Document,
  DocumentStub,
  LabelStub,
  LanguageModelSpecification,
  LanguageModelSpecificationStub,
  Workflow,
  WorkflowExecution,
  WorkflowExecutionStub,
  WorkflowStub,
} from "@/lib/models";

/**
 * Convert a model to its stub equivalent e.g., Document to DocumentStub.
 */
export function stubify(concept: Concept): ConceptStub;
export function stubify(conceptScheme: ConceptScheme): ConceptSchemeStub;
export function stubify(corpus: Corpus): CorpusStub;
export function stubify(document: Document): DocumentStub;
export function stubify(
  languageModelSpecification: LanguageModelSpecification,
): LanguageModelSpecificationStub;
export function stubify(
  workflowExecution: WorkflowExecution,
): WorkflowExecutionStub;
export function stubify(workflow: Workflow): WorkflowStub;
export function stubify(
  model:
    | Concept
    | ConceptScheme
    | Corpus
    | Document
    | LanguageModelSpecification
    | Workflow
    | WorkflowExecution,
):
  | ConceptSchemeStub
  | ConceptStub
  | CorpusStub
  | DocumentStub
  | LanguageModelSpecificationStub
  | WorkflowExecutionStub
  | WorkflowStub {
  switch (model.type) {
    case "Concept":
      return ConceptStub.create({
        identifier: model.identifier,
        prefLabel: model.prefLabel,
        prefLabelXl: model.prefLabelXl.map((label) => LabelStub.create(label)),
      });
    case "ConceptScheme":
      return ConceptSchemeStub.create({
        identifier: model.identifier,
        prefLabel: model.prefLabel,
        prefLabelXl: model.prefLabelXl.map((label) => LabelStub.create(label)),
      });
    case "Corpus":
      return new CorpusStub({
        deleted: model.deleted,
        identifier: model.identifier,
        label: model.label,
      });
    case "Document":
      return new DocumentStub({
        deleted: model.deleted,
        identifier: model.identifier,
        title: model.title,
      });
    case "LanguageModelSpecification":
      return new LanguageModelSpecificationStub({
        identifier: model.identifier,
        label: model.label,
      });
    case "Workflow":
      return new WorkflowStub({
        deleted: model.deleted,
        identifier: model.identifier,
        label: model.label,
      });
    case "WorkflowExecution":
      return new WorkflowExecutionStub({
        endedAtTime: model.endedAtTime,
        identifier: model.identifier,
        startedAtTime: model.startedAtTime,
      });
  }
}
