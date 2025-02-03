import {
  Claim,
  ClaimProperty,
  ClaimQuery,
  Corpus,
  CorpusDeletion,
  CorpusQuery,
  CorpusStub,
  Document,
  DocumentDeletion,
  DocumentQuery,
  DocumentStub,
  Identifier,
  LanguageModelSpecification,
  LanguageModelSpecificationStub,
  Workflow,
  WorkflowDeletion,
  WorkflowExecution,
  WorkflowExecutionInput,
  WorkflowExecutionQuery,
  WorkflowExecutionStub,
  WorkflowQuery,
  WorkflowStepExecutionInput,
  WorkflowStub,
} from "@/lib/models";
import { Kos } from "@kos-kit/models";
import { DatasetCore } from "@rdfjs/types";
import { Either } from "purify-ts";

/**
 * The top-level entry point for accessing models.
 */
export interface ModelSet extends Kos {
  /**
   * Add a model to the ModelSet.
   *
   * @param model model to be added
   */
  addModel(model: ModelSet.AddableModel): Promise<Either<Error, null>>;

  claim(identifier: Identifier): Promise<Either<Error, Claim>>;

  claimProperties(): Promise<Either<Error, readonly ClaimProperty[]>>;

  claims(kwds: {
    query: ClaimQuery;
  }): Promise<Either<Error, readonly Claim[]>>;

  // Clear the contents of the ModelSet.
  clear(): Promise<Either<Error, null>>;

  corpus(identifier: Identifier): Promise<Either<Error, Corpus>>;
  corpusStubs(kwds: { query: CorpusQuery }): Promise<
    Either<Error, readonly CorpusStub[]>
  >;

  /**
   * Soft delete a model from the ModelSet.
   *
   * @param model model to be deleted
   */
  deleteModel(model: ModelSet.DeletableModel): Promise<Either<Error, null>>;

  document(identifier: Identifier): Promise<Either<Error, Document>>;
  documentStubs(parameters: {
    limit: number | null;
    offset: number;
    query: DocumentQuery;
  }): Promise<Either<Error, readonly DocumentStub[]>>;
  documentsCount(query: DocumentQuery): Promise<Either<Error, number>>;

  isEmpty(): Promise<Either<Error, boolean>>;

  languageModelSpecification(
    identifier: Identifier,
  ): Promise<Either<Error, LanguageModelSpecification>>;
  languageModelSpecifications(): Promise<
    Either<Error, readonly LanguageModelSpecification[]>
  >;
  languageModelSpecificationStubs(): Promise<
    Either<Error, readonly LanguageModelSpecificationStub[]>
  >;

  /**
   * Load quads in the dataset into the ModelSet.
   */
  load(dataset: DatasetCore): Promise<Either<Error, null>>;

  workflow(identifier: Identifier): Promise<Either<Error, Workflow>>;

  workflowExecution(
    identifier: Identifier,
  ): Promise<Either<Error, WorkflowExecution>>;

  workflowExecutionStubs(parameters: {
    query: WorkflowExecutionQuery;
  }): Promise<Either<Error, readonly WorkflowExecutionStub[]>>;

  workflowStubs(parameters: {
    query: WorkflowQuery;
  }): Promise<Either<Error, readonly WorkflowStub[]>>;
}

export namespace ModelSet {
  export type AddableModel =
    | Claim
    | ClaimProperty
    | Corpus
    | CorpusDeletion
    | Document
    | DocumentDeletion
    | Workflow
    | WorkflowDeletion
    | WorkflowExecution
    | WorkflowExecutionInput
    | WorkflowStepExecutionInput;

  export interface DeletableModel {
    readonly identifier: Identifier;
    readonly type: (Corpus | Document | Workflow)["type"];
  }
}
