import { dataFactory } from "@/lib/rdfEnvironment";
import { NamedNode } from "@rdfjs/types";
import { Type } from "cmd-ts";

export const NamedNodesType: Type<string[], NamedNode[]> = {
  async from(input) {
    return input.map(dataFactory.namedNode);
  },
};
