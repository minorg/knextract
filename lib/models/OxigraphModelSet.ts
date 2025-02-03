import { logger } from "@/lib/logger";
import { LanguageTag } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { dataFactory } from "@/lib/rdfEnvironment";
import {
  LoggingSparqlGraphStoreClient,
  LoggingSparqlQueryClient,
  LoggingSparqlUpdateClient,
  OxigraphSparqlClient,
} from "@kos-kit/sparql-client";
import * as oxigraph from "oxigraph";

/**
 * A ModelSet backed by an in-memory oxigraph.Store.
 */
export class OxigraphModelSet extends SparqlModelSet {
  private constructor(
    parameters: ConstructorParameters<typeof SparqlModelSet>[0],
  ) {
    super(parameters);
  }

  /**
   * Clone an RdfjsDatasetModelSet into an OxigraphModelSet.
   */
  static clone(
    modelSet: RdfjsDatasetModelSet,
    options?: { logging?: boolean },
  ): OxigraphModelSet {
    const store = new oxigraph.Store();
    for (const quad of modelSet.dataset) {
      store.add(quad);
    }
    const sparqlClient = new OxigraphSparqlClient({
      dataFactory,
      store,
      useDefaultGraphAsUnion: true,
    });
    if (!options?.logging) {
      return new OxigraphModelSet({
        languageIn: modelSet.languageIn,
        sparqlGraphStoreClient: sparqlClient,
        sparqlQueryClient: sparqlClient,
        sparqlUpdateClient: sparqlClient,
      });
    }
    return new OxigraphModelSet({
      languageIn: modelSet.languageIn,
      sparqlGraphStoreClient: new LoggingSparqlGraphStoreClient({
        delegate: sparqlClient,
        logger,
      }),
      sparqlQueryClient: new LoggingSparqlQueryClient({
        delegate: sparqlClient,
        logger,
      }),
      sparqlUpdateClient: new LoggingSparqlUpdateClient({
        delegate: sparqlClient,
        logger,
      }),
    });
  }

  static create({
    languageIn,
  }: { languageIn: readonly LanguageTag[] }): OxigraphModelSet {
    return OxigraphModelSet.clone(new RdfjsDatasetModelSet({ languageIn }));
  }
}
