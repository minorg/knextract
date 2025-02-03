import { RdfEnvironment } from "@/lib/rdf-environments/RdfEnvironment";
import { RdfFormat } from "@kos-kit/next-utils";
import PrefixMap from "@rdfjs/prefix-map/PrefixMap";
import Serializer from "@rdfjs/serializer-turtle";
import { DatasetCore, NamedNode, Quad } from "@rdfjs/types";
import N3, { Prefixes, WriterOptions } from "n3";
import { Either } from "purify-ts";

export const n3RdfEnvironment: RdfEnvironment<DatasetCore, Quad> = {
  dataFactory: N3.DataFactory,

  datasetCoreFactory: {
    dataset: (quads) => new N3.Store(quads),
  },

  parsers: {
    parseString: (
      input: string,
      options: { format: RdfFormat },
    ): Either<Error, DatasetCore<Quad, Quad>> =>
      Either.encase(
        () =>
          new N3.Store(
            new N3.Parser({
              ...options,
            }).parse(input),
          ),
      ),
  },

  serializers: {
    async serializeToString(
      dataset: DatasetCore,
      { format, sorted }: { format: RdfFormat; sorted?: boolean },
    ): Promise<string> {
      const { rdf, rdfs, skos, xsd } = await import(
        "@tpluscode/rdf-ns-builders"
      );

      const prefixMap = new PrefixMap(
        [
          [
            "knextract",
            N3.DataFactory.namedNode(
              "http://purl.archive.org/purl/knextract/ontology#",
            ),
          ],
          [
            "knextract-cbox",
            N3.DataFactory.namedNode(
              "http://purl.archive.org/purl/knextract/cbox#",
            ),
          ],
          ["rdf", rdf[""]],
          ["rdfs", rdfs[""]],
          ["skos", skos[""]],
          ["xsd", xsd[""]],
        ],
        { factory: N3.DataFactory },
      );

      switch (format) {
        case "application/n-quads": {
          if (sorted) {
            const writer = new N3.Writer({ format: "application/N-Quads" });
            const nquads: string[] = [];
            for (const quad of dataset) {
              nquads.push(
                writer
                  .quadToString(
                    quad.subject,
                    quad.predicate,
                    quad.object,
                    quad.graph,
                  )
                  .trimEnd(),
              );
            }
            nquads.sort();
            return `${nquads.join("\n")}\n`;
          }

          return new N3.Writer({ format: "application/N-Quads" }).quadsToString(
            [...dataset],
          );
        }
        case "application/n-triples": {
          if (sorted) {
            const writer = new N3.Writer({ format: "application/N-Triples" });
            const ntriples: string[] = [];
            for (const quad of dataset) {
              // If we don't explicitly drop the graph, the serializer will include it.
              ntriples.push(
                writer
                  .quadToString(quad.subject, quad.predicate, quad.object)
                  .trimEnd(),
              );
            }
            return `${ntriples.join("\n")}\n`;
          }

          return new N3.Writer({
            format: "application/N-Triples",
          }).quadsToString([...dataset]);
        }
        case "application/trig": {
          return new Promise((resolve, reject) => {
            const prefixes: Prefixes<NamedNode> = {};
            for (const [prefix, namespace] of prefixMap.entries()) {
              prefixes[prefix] = namespace;
            }
            const writer = new N3.Writer({
              format: "application/trig",
              prefixes,
            } satisfies WriterOptions);
            for (const quad of dataset) {
              writer.addQuad(quad);
            }
            writer.end((error, result) => {
              if (error) {
                reject(error);
              } else if (result) {
                resolve(result);
              } else {
                reject(new Error("no result"));
              }
            });
          });
        }
        case "text/turtle": {
          // Use the serializer-turtle instead of N3, it produces nicer Turtle.
          const serializer = new Serializer({
            prefixes: prefixMap,
          });
          return serializer.transform([...dataset]);
        }
        default:
          throw new RangeError(`${format} serialization not supported by N3`);
      }
    },
  },
};
