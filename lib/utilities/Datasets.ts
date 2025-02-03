import TermMap from "@rdfjs/term-map";
import {
  BlankNode,
  DatasetCore,
  DatasetCoreFactory,
  DefaultGraph,
  NamedNode,
} from "@rdfjs/types";

export namespace Datasets {
  // export function clear(dataset: DatasetCore): void {
  //   for (const quad of [...dataset]) {
  //     dataset.delete(quad);
  //   }
  // }
  //
  // export function deepCopy({
  //   dataFactory,
  //   fromDataset,
  //   toDataset,
  // }: {
  //   dataFactory: DataFactory;
  //   fromDataset: Iterable<Quad>;
  //   toDataset: {
  //     add(quad: Quad): any;
  //   };
  // }): void {
  //   for (const quad of fromDataset) {
  //     toDataset.add(Terms.deepCopy({ dataFactory, term: quad }) as Quad);
  //   }
  // }

  export function splitByGraph({
    dataset,
    datasetCoreFactory,
  }: { dataset: DatasetCore; datasetCoreFactory: DatasetCoreFactory }): TermMap<
    BlankNode | DefaultGraph | NamedNode,
    DatasetCore
  > {
    const result = new TermMap<
      BlankNode | DefaultGraph | NamedNode,
      DatasetCore
    >();
    for (const quad of dataset) {
      if (quad.graph.termType === "Variable") {
        throw new RangeError(quad.graph.termType);
      }
      if (!result.has(quad.graph)) {
        result.set(quad.graph, datasetCoreFactory.dataset());
      }
      result.get(quad.graph)!.add(quad);
    }
    return result;
  }
}
