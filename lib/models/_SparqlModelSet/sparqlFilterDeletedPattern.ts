import { knextract } from "@/lib/vocabularies";
import { Variable } from "@rdfjs/types";
import { Maybe } from "purify-ts";
import { toRdf } from "rdf-literal";
import * as sparqljs from "sparqljs";

export function sparqlFilterDeletedPattern({
  query,
  subject,
}: {
  query: { includeDeleted?: boolean };
  subject: Variable;
}): Maybe<sparqljs.Pattern> {
  if (query.includeDeleted) {
    return Maybe.empty();
  }

  return Maybe.of({
    expression: {
      args: [
        {
          triples: [
            {
              predicate: knextract.deleted,
              object: toRdf(true),
              subject,
            },
          ],
          type: "bgp",
        },
      ],
      operator: "NOT EXISTS",
      type: "operation",
    },
    type: "filter",
  });
}
