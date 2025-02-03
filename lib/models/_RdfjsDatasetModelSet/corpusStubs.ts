import { CorpusQuery, CorpusStub, sortModelsByIdentifier } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { Either } from "purify-ts";

export async function corpusStubs(
  this: RdfjsDatasetModelSet,
  parameters: { query: CorpusQuery },
): Promise<Either<Error, readonly CorpusStub[]>> {
  return Either.of(this.corpusStubsSync(parameters));
}

export function corpusStubsSync(
  this: RdfjsDatasetModelSet,
  { query }: { query: CorpusQuery },
): readonly CorpusStub[] {
  switch (query.type) {
    case "All":
      return sortModelsByIdentifier([
        ...this.resourceSet
          .namedInstancesOf(CorpusStub.fromRdfType)
          .flatMap((resource) =>
            CorpusStub.fromRdf({
              ignoreRdfType: true,
              languageIn: this.languageIn,
              resource,
            })
              .toMaybe()
              .toList(),
          )
          .filter((corpusStub) => query.includeDeleted || !corpusStub.deleted),
      ]);
  }
}
