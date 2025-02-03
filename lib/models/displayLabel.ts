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
  Workflow,
  WorkflowStub,
  kosLabels,
} from "@/lib/models";

export function displayLabel({
  model,
}: {
  locale: string;
  model:
    | Concept
    | ConceptScheme
    | ConceptSchemeStub
    | ConceptStub
    | Corpus
    | CorpusStub
    | Document
    | DocumentStub
    | Workflow
    | WorkflowStub;
}): string {
  switch (model.type) {
    case "Concept":
    case "ConceptScheme":
    case "ConceptSchemeStub":
    case "ConceptStub":
      return kosLabels(model).display;
    case "Corpus":
      return model.label;
    case "CorpusStub":
      return model.label.orDefault(Identifier.toString(model.identifier));
    case "Document":
    case "DocumentStub":
      return model.title
        .map((title) => title.literalForm)
        .orDefault(Identifier.toString(model.identifier));
    case "Workflow":
      return model.label;
    case "WorkflowStub":
      return model.label.orDefault(Identifier.toString(model.identifier));
  }
}
