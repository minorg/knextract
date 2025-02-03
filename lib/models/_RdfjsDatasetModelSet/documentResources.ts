import { Document, DocumentQuery, Identifier } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { knextract } from "@/lib/vocabularies";
import { Resource } from "rdfjs-resource";

export function* documentResourcesSync(
  this: RdfjsDatasetModelSet,
  query: DocumentQuery,
): Generator<Resource<Identifier>> {
  switch (query.type) {
    case "All":
      yield* this.resourceSet.namedInstancesOf(Document.fromRdfType);
      return;
    case "Identifiers":
      yield* query.documentIdentifiers.map((identifier) =>
        this.resourceSet.namedResource(identifier),
      );
      return;
    case "MemberOfCorpus":
      yield* this.resourceSet
        .resource(query.corpusIdentifier)
        .valuesOf(knextract.memberOfCorpus)
        .flatMap((value) => value.toNamedResource().toMaybe().toList());
      return;
  }
}
