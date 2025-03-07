import {
  Concept,
  ConceptScheme,
  ConceptSchemeStub,
  ConceptStub,
  Corpus,
  CorpusStub,
  Document,
  DocumentStub,
  Identifier,
  LanguageModelSpecification,
  LanguageModelSpecificationStub,
  Workflow,
  WorkflowStub,
  kosResourceLabels,
} from "@/lib/models";

export function displayLabel(
  model:
    | Concept
    | ConceptScheme
    | ConceptSchemeStub
    | ConceptStub
    | Corpus
    | CorpusStub
    | Document
    | DocumentStub
    | LanguageModelSpecification
    | LanguageModelSpecificationStub
    | Workflow
    | WorkflowStub,
  // biome-ignore lint/correctness/noEmptyPattern: <explanation>
  {}: {
    locale: string;
  },
): string {
  switch (model.type) {
    case "Concept":
    case "ConceptScheme":
    case "ConceptSchemeStub":
    case "ConceptStub":
      return kosResourceLabels(model).display;
    case "Corpus":
      return model.label;
    case "CorpusStub":
      return model.label.orDefault(Identifier.toString(model.identifier));
    case "Document":
    case "DocumentStub":
      return model.title
        .map((title) => title.literalForm)
        .orDefault(Identifier.toString(model.identifier));
    case "LanguageModelSpecification":
      return model.label;
    case "LanguageModelSpecificationStub":
      return model.label.orDefault(Identifier.toString(model.identifier));
    case "Workflow":
      return model.label;
    case "WorkflowStub":
      return model.label.orDefault(Identifier.toString(model.identifier));
  }
}
