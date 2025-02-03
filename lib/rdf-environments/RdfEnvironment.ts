import { RdfFormat } from "@kos-kit/next-utils";
import {
  DataFactory,
  DatasetCore,
  DatasetCoreFactory,
  Quad,
} from "@rdfjs/types";
import { Either } from "purify-ts";

export interface RdfEnvironment<
  DatasetCoreT extends DatasetCore<QuadT, QuadT>,
  QuadT extends Quad,
> {
  readonly dataFactory: DataFactory<QuadT, QuadT>;
  readonly datasetCoreFactory: DatasetCoreFactory<QuadT, QuadT, DatasetCoreT>;
  readonly parsers: {
    parseString(
      input: string,
      options: { format: RdfFormat },
    ): Either<Error, DatasetCoreT>;
  };
  readonly serializers: {
    serializeToString(
      dataset: DatasetCore,
      options: { format: RdfFormat; sorted?: boolean },
    ): Promise<string>;
  };
}
