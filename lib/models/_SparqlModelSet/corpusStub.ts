import { CorpusStub, Identifier } from "@/lib/models";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { Either } from "purify-ts";

export async function corpusStub(
  this: SparqlModelSet,
  identifier: Identifier,
): Promise<Either<Error, CorpusStub>> {
  return this.modelByIdentifier({
    identifier,
    modelFactory: {
      fromRdf: CorpusStub.fromRdf,
      sparqlConstructQueryString: CorpusStub.sparqlConstructQueryString,
    },
  });
}
