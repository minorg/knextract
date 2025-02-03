import { dataFactory } from "@/lib/rdfEnvironment";
import { NamedNode } from "@rdfjs/types";

export type Identifier = NamedNode;

export namespace Identifier {
  export function fromString(identifierString: string): Identifier {
    return dataFactory.namedNode(identifierString);
  }

  // biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
  export function toString(identifier: Identifier): string {
    return identifier.value;
  }
}
