import { logger } from "@/lib/logger";
import { Identifier, LanguageTag, ModelSet } from "@/lib/models";
import {
  CorpusDeletion,
  CorpusDeletionInput,
  CorpusStub,
  DocumentDeletion,
  DocumentDeletionInput,
  DocumentStub,
  WorkflowDeletion,
  WorkflowDeletionInput,
  WorkflowStub,
} from "@/lib/models";
import { modelMutateGraph } from "@/lib/models/modelMutateGraph";
import { dataFactory, datasetCoreFactory } from "@/lib/rdfEnvironment";
import { knextract } from "@/lib/vocabularies";
import { ModelFactories, RdfjsDatasetKos } from "@kos-kit/models";
import { DatasetCore } from "@rdfjs/types";
import { Either, Maybe } from "purify-ts";
import { toRdf } from "rdf-literal";
import { MutableResourceSet } from "rdfjs-resource";
import * as _RdfjsDatasetModelSet from "./_RdfjsDatasetModelSet";

export class RdfjsDatasetModelSet extends RdfjsDatasetKos implements ModelSet {
  claim = _RdfjsDatasetModelSet.claim;
  claimProperties = _RdfjsDatasetModelSet.claimProperties;
  claimPropertiesSync = _RdfjsDatasetModelSet.claimPropertiesSync;
  claimSync = _RdfjsDatasetModelSet.claimSync;
  claims = _RdfjsDatasetModelSet.claims;
  claimsSync = _RdfjsDatasetModelSet.claimsSync;
  corpus = _RdfjsDatasetModelSet.corpus;
  corpusStubs = _RdfjsDatasetModelSet.corpusStubs;
  corpusStubsSync = _RdfjsDatasetModelSet.corpusStubsSync;
  corpusSync = _RdfjsDatasetModelSet.corpusSync;
  document = _RdfjsDatasetModelSet.document;
  documentStubs = _RdfjsDatasetModelSet.documentStubs;
  documentStubsSync = _RdfjsDatasetModelSet.documentStubsSync;
  documentSync = _RdfjsDatasetModelSet.documentSync;
  documentsCount = _RdfjsDatasetModelSet.documentsCount;
  documentsCountSync = _RdfjsDatasetModelSet.documentsCountSync;
  languageModelSpecification = _RdfjsDatasetModelSet.languageModelSpecification;
  languageModelSpecificationSync =
    _RdfjsDatasetModelSet.languageModelSpecificationSync;
  languageModelSpecifications =
    _RdfjsDatasetModelSet.languageModelSpecifications;
  languageModelSpecificationsSync =
    _RdfjsDatasetModelSet.languageModelSpecificationsSync;
  languageModelSpecificationStubs =
    _RdfjsDatasetModelSet.languageModelSpecificationStubs;
  languageModelSpecificationStubsSync =
    _RdfjsDatasetModelSet.languageModelSpecificationStubsSync;
  readonly mutableResourceSet: MutableResourceSet;
  workflow = _RdfjsDatasetModelSet.workflow;
  workflowExecution = _RdfjsDatasetModelSet.workflowExecution;
  workflowExecutionStubs = _RdfjsDatasetModelSet.workflowExecutionStubs;
  workflowExecutionStubsSync = _RdfjsDatasetModelSet.workflowExecutionStubsSync;
  workflowExecutionSync = _RdfjsDatasetModelSet.workflowExecutionSync;
  workflowStubs = _RdfjsDatasetModelSet.workflowStubs;
  workflowStubsSync = _RdfjsDatasetModelSet.workflowStubsSync;
  workflowSync = _RdfjsDatasetModelSet.workflowSync;

  constructor(kwds?: {
    dataset?: DatasetCore;
    languageIn?: readonly LanguageTag[];
  }) {
    super({
      dataset: kwds?.dataset ?? datasetCoreFactory.dataset(),
      modelFactories: ModelFactories.default_,
      languageIn: kwds?.languageIn ?? [],
    });
    this.mutableResourceSet = new MutableResourceSet({
      dataFactory,
      dataset: this.dataset,
    });
  }

  async addModel(model: ModelSet.AddableModel): Promise<Either<Error, null>> {
    this.addModelSync(model);
    return Either.of(null);
  }

  /**
   * Add a model to the underlying RDF/JS Dataset.
   *
   * This declaration is in the class in order to return this (which you can only do from methods) and allow chaining.
   */
  addModelSync(model: ModelSet.AddableModel): this {
    for (const _ of this.dataset.match(model.identifier)) {
      logger.debug(
        "adding duplicate %s model to model set: %s",
        model.constructor.name,
        Identifier.toString(model.identifier),
      );
      return this;
    }

    model.toRdf({
      mutateGraph: modelMutateGraph(model),
      resourceSet: this.mutableResourceSet,
    });

    return this;
  }

  async load(dataset: DatasetCore): Promise<Either<Error, null>> {
    this.loadSync(dataset);
    return Either.of(null);
  }

  loadSync(dataset: DatasetCore): void {
    for (const quad of dataset) {
      this.dataset.add(quad);
    }
  }

  async clear(): Promise<Either<Error, null>> {
    this.clearSync();
    return Either.of(null);
  }

  clearSync(): void {
    for (const quad of [...this.dataset]) {
      this.dataset.delete(quad);
    }
  }

  cloneSync(): RdfjsDatasetModelSet {
    return new RdfjsDatasetModelSet({
      dataset: datasetCoreFactory.dataset([...this.dataset]),
      languageIn: this.languageIn,
    });
  }

  async isEmpty(): Promise<Either<Error, boolean>> {
    return Either.of(this.isEmptySync());
  }

  isEmptySync(): boolean {
    return this.dataset.size === 0;
  }

  async deleteModel(
    model: ModelSet.DeletableModel,
  ): Promise<Either<Error, null>> {
    this.deleteModelSync(model);
    return Either.of(null);
  }

  deleteModelSync(model: ModelSet.DeletableModel): void {
    const mutateGraph = modelMutateGraph(model);

    this.mutableResourceSet
      .mutableNamedResource({
        identifier: model.identifier,
        mutateGraph,
      })
      .add(knextract.deleted, toRdf(true));

    const startedAtTime = new Date();
    const endedAtTime = Maybe.of(startedAtTime);
    switch (model.type) {
      case "Corpus":
        this.addModelSync(
          new CorpusDeletion({
            endedAtTime,
            input: new CorpusDeletionInput({
              corpus: new CorpusStub({ identifier: model.identifier }),
            }),
            startedAtTime,
          }),
        );
        break;
      case "Document":
        this.addModelSync(
          new DocumentDeletion({
            endedAtTime,
            input: new DocumentDeletionInput({
              document: new DocumentStub({ identifier: model.identifier }),
            }),
            startedAtTime,
          }),
        );
        break;
      case "Workflow":
        this.addModelSync(
          new WorkflowDeletion({
            endedAtTime,
            input: new WorkflowDeletionInput({
              workflow: new WorkflowStub({ identifier: model.identifier }),
            }),
            startedAtTime,
          }),
        );
        break;
    }
  }
}
