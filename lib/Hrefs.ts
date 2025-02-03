// Don't import these through @/lib/models to avoid Playwright ESM issues
// import { Identifier, Locale } from "@/lib/models";
import { Identifier } from "@/lib/models/Identifier";
import { Locale } from "@/lib/models/Locale";
import { encodeFileName } from "@kos-kit/next-utils";
import qs from "qs";

export class Hrefs {
  private readonly _locale: Locale;
  private readonly basePath: string;

  constructor({
    basePath,
    locale,
  }: {
    basePath: string;
    locale: Locale;
  }) {
    this.basePath = basePath;
    this._locale = locale;
  }

  get conceptSchemes() {
    return `${this.locale}/concept-schemes`;
  }

  get corpora() {
    return `${this.locale}/corpora`;
  }

  get locale() {
    return `${this.basePath}/${this._locale}`;
  }

  get newCorpus() {
    return `${this.corpora}/new`;
  }

  get newWorkflow() {
    return `${this.workflows}/new`;
  }

  get workflows() {
    return `${this.locale}/workflows`;
  }

  annotation({ identifier }: { identifier: Identifier | string }) {
    return `${this.locale}/annotations/${encodeFileName(
      typeof identifier === "string"
        ? identifier
        : Identifier.toString(identifier),
    )}`;
  }

  concept({ identifier }: { identifier: Identifier | string }) {
    return `${this.locale}/concepts/${encodeFileName(
      typeof identifier === "string"
        ? identifier
        : Identifier.toString(identifier),
    )}`;
  }

  conceptScheme(
    { identifier }: { identifier: Identifier | string },
    query?: { pageIndex?: number; pageSize?: number },
  ) {
    return `${this.conceptSchemes}/${encodeFileName(
      typeof identifier === "string"
        ? identifier
        : Identifier.toString(identifier),
    )}${qs.stringify(query, { addQueryPrefix: true })}`;
  }

  corpus(
    { identifier }: { identifier: Identifier | string },
    query?: { pageIndex?: number; pageSize?: number },
  ) {
    return `${this.corpora}/${encodeFileName(
      typeof identifier === "string"
        ? identifier
        : Identifier.toString(identifier),
    )}${qs.stringify(query, { addQueryPrefix: true })}`;
  }

  document({ identifier }: { identifier: Identifier | string }) {
    return `${this.locale}/documents/${encodeFileName(
      typeof identifier === "string"
        ? identifier
        : Identifier.toString(identifier),
    )}`;
  }

  uploadDocument(corpus: { identifier: Identifier | string }) {
    return `${this.corpus(corpus)}/upload-document`;
  }

  workflow({ identifier }: { identifier: Identifier | string }) {
    return `${this.workflows}/${encodeFileName(
      typeof identifier === "string"
        ? identifier
        : Identifier.toString(identifier),
    )}`;
  }

  workflowExecution({
    workflowExecutionIdentifier,
    workflowIdentifier,
  }: {
    workflowExecutionIdentifier: Identifier | string;
    workflowIdentifier: Identifier | string;
  }) {
    return `${this.workflow({ identifier: workflowIdentifier })}/executions/${encodeFileName(
      typeof workflowExecutionIdentifier === "string"
        ? workflowExecutionIdentifier
        : Identifier.toString(workflowExecutionIdentifier),
    )}`;
  }
}
