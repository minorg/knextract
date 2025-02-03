import { Document, DocumentQuery } from "@/lib/models";
import { sparqlFilterDeletedPattern } from "@/lib/models/_SparqlModelSet/sparqlFilterDeletedPattern";
import { knextract } from "@/lib/vocabularies";
import { sparqlRdfTypePattern } from "@kos-kit/models/sparqlRdfTypePattern";
import { Variable } from "@rdfjs/types";
import * as sparqljs from "sparqljs";

export function documentQueryToWherePatterns({
  query,
  subject,
}: {
  query: DocumentQuery;
  subject: Variable;
}): readonly sparqljs.Pattern[] {
  switch (query.type) {
    case "All":
      return [
        sparqlRdfTypePattern({
          rdfType: Document.fromRdfType,
          subject,
        }),
        ...sparqlFilterDeletedPattern({ query, subject }).toList(),
      ];
    case "Identifiers":
      return [
        {
          values: query.documentIdentifiers.map((identifier) => {
            const valuePatternRow: sparqljs.ValuePatternRow = {};
            valuePatternRow[`?${subject.value}`] = identifier;
            return valuePatternRow;
          }),
          type: "values",
        },
      ];
    case "MemberOfCorpus":
      return [
        {
          triples: [
            {
              subject,
              predicate: knextract.memberOfCorpus,
              object: query.corpusIdentifier,
            },
          ],
          type: "bgp",
        },
        ...sparqlFilterDeletedPattern({ query, subject }).toList(),
      ];
  }
}
