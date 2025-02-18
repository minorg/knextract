import { Identifier } from "./Identifier.js";

export type ClaimQuery =
  | {
      readonly type: "All";
    }
  | {
      // Claims on the given document
      readonly documentIdentifier: Identifier;
      readonly gold?: boolean;
      readonly type: "Document";
    };
