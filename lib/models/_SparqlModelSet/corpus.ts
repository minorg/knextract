import { Corpus, Identifier } from "@/lib/models";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { Either } from "purify-ts";

export async function corpus(
  this: SparqlModelSet,
  identifier: Identifier,
): Promise<Either<Error, Corpus>> {
  return this.modelByIdentifier({
    identifier,
    modelFactory: {
      fromRdf: Corpus.fromRdf,
      sparqlConstructQueryString: Corpus.sparqlConstructQueryString,
    },
  });
}
