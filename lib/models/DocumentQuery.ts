import { Identifier } from "./Identifier.js";

export type DocumentQuery =
  | { readonly includeDeleted: boolean; readonly type: "All" }
  | {
      readonly documentIdentifiers: readonly Identifier[];
      readonly type: "Identifiers";
    }
  | {
      // Documents that are in the given corpus
      readonly includeDeleted: boolean;
      readonly corpusIdentifier: Identifier;
      readonly type: "MemberOfCorpus";
    };
