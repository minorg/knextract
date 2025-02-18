import { logger } from "@/lib/logger";
import { ModelSet } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { dataFactory, datasetCoreFactory } from "@/lib/rdfEnvironment";
import { Datasets } from "@/lib/utilities";
import { ModelFactories, SparqlKos, mapBindingsToCount } from "@kos-kit/models";
import {
  SparqlGraphStoreClient,
  SparqlUpdateClient,
} from "@kos-kit/sparql-client";
import { DatasetCore } from "@rdfjs/types";
import { Either, EitherAsync } from "purify-ts";
import invariant from "ts-invariant";
import * as _SparqlModelSet from "./_SparqlModelSet";

export class SparqlModelSet extends SparqlKos implements ModelSet {
  claim = _SparqlModelSet.claim;
  claimProperties = _SparqlModelSet.claimProperties;
  claims = _SparqlModelSet.claims;
  corpus = _SparqlModelSet.corpus;
  corpusStub = _SparqlModelSet.corpusStub;
  corpusStubs = _SparqlModelSet.corpusStubs;
  document = _SparqlModelSet.document;
  documentStub = _SparqlModelSet.documentStub;
  documentStubs = _SparqlModelSet.documentStubs;
  documentsCount = _SparqlModelSet.documentsCount;
  languageModelSpecification = _SparqlModelSet.languageModelSpecification;
  languageModelSpecifications = _SparqlModelSet.languageModelSpecifications;
  languageModelSpecificationStub =
    _SparqlModelSet.languageModelSpecificationStub;
  languageModelSpecificationStubs =
    _SparqlModelSet.languageModelSpecificationStubs;
  private readonly sparqlGraphStoreClient: SparqlGraphStoreClient;
  private readonly sparqlUpdateClient: SparqlUpdateClient;
  workflow = _SparqlModelSet.workflow;
  workflowExecution = _SparqlModelSet.workflowExecution;
  workflowExecutionStub = _SparqlModelSet.workflowExecutionStub;
  workflowExecutionStubs = _SparqlModelSet.workflowExecutionStubs;
  workflowStub = _SparqlModelSet.workflowStub;
  workflowStubs = _SparqlModelSet.workflowStubs;

  constructor({
    sparqlGraphStoreClient,
    sparqlUpdateClient,
    ...superParameters
  }: {
    sparqlGraphStoreClient: SparqlGraphStoreClient;
    sparqlUpdateClient: SparqlUpdateClient;
  } & Omit<
    ConstructorParameters<typeof SparqlKos>[0],
    "datasetCoreFactory" | "dataFactory" | "modelFactories"
  >) {
    super({
      datasetCoreFactory,
      dataFactory,
      modelFactories: ModelFactories.default_,
      ...superParameters,
    });
    this.sparqlGraphStoreClient = sparqlGraphStoreClient;
    this.sparqlUpdateClient = sparqlUpdateClient;
  }

  async addModel<ModelT extends ModelSet.AddableModel>(
    model: ModelT,
  ): Promise<Either<Error, null>> {
    return EitherAsync(async () => {
      const memModelSet = new RdfjsDatasetModelSet();
      await memModelSet.addModel(model);
      invariant(memModelSet.dataset.size > 0);
      for (const [graph, graphDataset] of Datasets.splitByGraph({
        dataset: memModelSet.dataset,
        datasetCoreFactory,
      }).entries()) {
        invariant(graph.termType !== "BlankNode");
        await this.sparqlGraphStoreClient.postGraph(graph, graphDataset);
      }
      return null;
    });
  }

  async clear(): Promise<Either<Error, null>> {
    return EitherAsync(async () => {
      logger.debug("clearing all quads from SPARQL");
      await this.sparqlUpdateClient.update("CLEAR ALL");
      logger.debug("cleared all quads from SPARQL");
      return null;
    });
  }

  async deleteModel(
    model: ModelSet.DeletableModel,
  ): Promise<Either<Error, null>> {
    return EitherAsync(async () => {
      const memModelSet = new RdfjsDatasetModelSet();
      await memModelSet.deleteModel(model);
      invariant(memModelSet.dataset.size > 0);
      for (const [graph, graphDataset] of Datasets.splitByGraph({
        dataset: memModelSet.dataset,
        datasetCoreFactory,
      }).entries()) {
        invariant(graph.termType !== "BlankNode");
        await this.sparqlGraphStoreClient.postGraph(graph, graphDataset);
      }
      return null;
    });
  }

  async isEmpty(): Promise<Either<Error, boolean>> {
    return (await this.size()).map((size) => size === 0);
  }

  async load(dataset: DatasetCore): Promise<Either<Error, null>> {
    return EitherAsync(async () => {
      // Separate the quads into named graphs, since a single Graph Store Protocol request can only contain triples for
      // a single graph
      const graphDatasets: Record<string, DatasetCore> = {};
      for (const quad of dataset) {
        let graph: string;
        switch (quad.graph.termType) {
          case "DefaultGraph":
            graph = "";
            break;
          case "NamedNode":
            graph = quad.graph.value;
            break;
          default:
            throw new RangeError(quad.graph.termType);
        }

        let graphDataset = graphDatasets[graph];
        if (!graphDataset) {
          graphDatasets[graph] = graphDataset = datasetCoreFactory.dataset();
        }
        graphDataset.add(quad);
      }

      for (const [graph, graphDataset] of Object.entries(graphDatasets)) {
        logger.debug(
          "posting %d triples to graph: %s",
          graphDataset.size,
          graph,
        );
        await this.sparqlGraphStoreClient.postGraph(
          graph.length > 0
            ? dataFactory.namedNode(graph)
            : dataFactory.defaultGraph(),
          graphDataset,
        );
        logger.debug(
          "posted %d triples to graph: %s",
          graphDataset.size,
          graph,
        );
      }

      return null;
    });
  }

  async size(): Promise<Either<Error, number>> {
    return EitherAsync(async ({ liftEither }) => {
      return liftEither(
        mapBindingsToCount(
          await this.sparqlQueryClient.queryBindings(
            "SELECT (COUNT(*) as ?count) WHERE { ?s ?p ?o}",
          ),
          "count",
        ),
      );
    });
  }
}
