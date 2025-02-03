import { RdfEnvironment } from "@/lib/rdf-environments/RdfEnvironment";
import { n3RdfEnvironment } from "@/lib/rdf-environments/n3RdfEnvironment";
import { RdfFormat } from "@kos-kit/next-utils";
import * as rdfjs from "@rdfjs/types";
import * as oxigraph from "oxigraph";
import { Either } from "purify-ts";

type Quad = oxigraph.Quad;

class DatasetCore implements rdfjs.DatasetCore<Quad, Quad> {
  constructor(readonly store: oxigraph.Store) {}

  get size() {
    return this.store.size;
  }

  [Symbol.iterator](): Iterator<Quad> {
    return this.store.match(null, null, null, null)[Symbol.iterator]();
  }

  add(quad: Quad): this {
    this.store.add(quad);
    return this;
  }

  delete(quad: Quad): this {
    this.store.delete(quad);
    return this;
  }

  has(quad: Quad): boolean {
    return this.store.has(quad);
  }

  match(
    subject?: rdfjs.Term | null,
    predicate?: rdfjs.Term | null,
    object?: rdfjs.Term | null,
    graph?: rdfjs.Term | null,
  ): DatasetCore {
    return new DatasetCore(
      new oxigraph.Store(this.store.match(subject, predicate, object, graph)),
    );
  }
}

export const oxigraphRdfEnvironment: RdfEnvironment<DatasetCore, Quad> = {
  // @ts-expect-error Iri type parameter incompatibility
  dataFactory: oxigraph,

  datasetCoreFactory: {
    dataset(quads?: Quad[]): DatasetCore {
      return new DatasetCore(new oxigraph.Store(quads));
    },
  },

  parsers: {
    parseString(
      input: string,
      options: { format: RdfFormat },
    ): Either<Error, DatasetCore> {
      return Either.encase(() => {
        const store = new oxigraph.Store();
        store.load(input, options);
        return store;
      }).map((store) => new DatasetCore(store));
    },
  },

  serializers: n3RdfEnvironment.serializers,
};
