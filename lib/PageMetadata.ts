import {
  Claim,
  ConceptSchemeStub,
  ConceptStub,
  CorpusStub,
  DocumentStub,
  Locale,
  WorkflowExecutionStub,
  WorkflowStub,
  displayLabel,
} from "@/lib/models";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export class PageMetadata {
  private readonly _locale: Locale;
  private readonly translations: Awaited<
    ReturnType<typeof getTranslations<"PageMetadata">>
  >;

  private constructor({
    locale,
    translations,
  }: {
    locale: Locale;
    translations: PageMetadata["translations"];
  }) {
    this._locale = locale;
    this.translations = translations;
  }

  get conceptSchemes(): Metadata {
    return {
      title: titlePartsToString([
        this.locale.title! as string,
        this.translations("Concept schemes"),
      ]),
    };
  }

  get corpora(): Metadata {
    return {
      title: titlePartsToString([
        this.locale.title! as string,
        this.translations("Corpora"),
      ]),
    };
  }

  get corpusNew(): Metadata {
    return {
      title: titlePartsToString([
        this.locale.title! as string,
        this.translations("New corpus"),
      ]),
    };
  }

  get locale(): Metadata {
    return {
      title: "Knextract",
    };
  }

  get workflowNew(): Metadata {
    return {
      title: titlePartsToString([
        this.locale.title! as string,
        this.translations("New workflow"),
      ]),
    };
  }

  get workflows(): Metadata {
    return {
      title: titlePartsToString([
        this.locale.title! as string,
        this.translations("Workflows"),
      ]),
    };
  }

  static async get({ locale }: { locale: Locale }) {
    return new PageMetadata({
      locale,
      translations: await getTranslations({
        locale,
        namespace: "PageMetadata",
      }),
    });
  }

  claim(_claim: Claim): Metadata {
    return {
      title: titlePartsToString([
        this.locale.title! as string,
        this.translations("Claim"),
      ]),
    };
  }

  concept(concept: ConceptStub): Metadata {
    return {
      title: titlePartsToString([
        this.locale.title! as string,
        this.translations("Concept"),
        displayLabel(concept, { locale: this._locale }),
      ]),
    };
  }

  conceptScheme(conceptScheme: ConceptSchemeStub): Metadata {
    return {
      title: titlePartsToString([
        this.locale.title! as string,
        this.translations("Concept scheme"),
        displayLabel(conceptScheme, { locale: this._locale }),
      ]),
    };
  }

  corpus(corpus: CorpusStub): Metadata {
    return {
      title: titlePartsToString([
        this.locale.title! as string,
        this.translations("Corpus"),
        ...corpus.label.toList(),
      ]),
    };
  }

  corpusUploadDocument(corpus: CorpusStub): Metadata {
    return {
      title: titlePartsToString([
        this.locale.title! as string,
        corpus.label.orDefault(this.translations("Corpus")),
        this.translations("Upload document"),
      ]),
    };
  }

  document(document: DocumentStub): Metadata {
    return {
      title: titlePartsToString([
        this.locale.title! as string,
        this.translations("Document"),
        ...document.title.map((title) => title.literalForm).toList(),
      ]),
    };
  }

  workflow(workflow: WorkflowStub): Metadata {
    return {
      title: titlePartsToString([
        this.locale.title! as string,
        this.translations("Workflow"),
        ...workflow.label.toList(),
      ]),
    };
  }

  workflowExecution({
    workflow,
  }: {
    workflow: WorkflowStub;
    workflowExecution: WorkflowExecutionStub;
  }): Metadata {
    return {
      title: titlePartsToString([
        this.locale.title! as string,
        this.translations("Workflow"),
        ...workflow.label.toList(),
        this.translations("Execution"),
      ]),
    };
  }
}

function titlePartsToString(titleParts: readonly string[]): string {
  return titleParts.join(": ");
}
