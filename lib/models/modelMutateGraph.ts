import { Identifier, ModelSet } from "@/lib/models";
import { dataFactory } from "@/lib/rdfEnvironment";
import { DefaultGraph, NamedNode } from "@rdfjs/types";

export function modelMutateGraph(_model: {
  identifier: Identifier;
  type: ModelSet.AddableModel["type"] | ModelSet.DeletableModel["type"];
}): DefaultGraph | NamedNode {
  return dataFactory.defaultGraph();
}
