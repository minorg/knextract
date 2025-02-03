import { DocumentQuery, DocumentStub } from "@/lib/models";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { documentIdentifiers } from "@/lib/models/_SparqlModelSet/documentIdentifiers";
import { Either, EitherAsync } from "purify-ts";

export async function documentStubs(
  this: SparqlModelSet,
  parameters: { limit: number | null; offset: number; query: DocumentQuery },
): Promise<Either<Error, readonly DocumentStub[]>> {
  return EitherAsync(async ({ liftEither }) => {
    const identifiers = await liftEither(
      await documentIdentifiers.bind(this)(parameters),
    );
    return (
      await this.modelsByIdentifiers({
        identifiers,
        modelFactory: {
          fromRdf: DocumentStub.fromRdf,
          sparqlConstructQueryString: DocumentStub.sparqlConstructQueryString,
        },
      })
    ).map((either, identifierI) =>
      either
        .mapLeft(
          () => new DocumentStub({ identifier: identifiers[identifierI] }),
        )
        .extract(),
    );
  });
}
