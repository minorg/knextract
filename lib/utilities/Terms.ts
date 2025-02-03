import { xsd } from "@/lib/vocabularies";
import {
  DataFactory,
  Quad_Graph,
  Quad_Object,
  Quad_Predicate,
  Quad_Subject,
  Term,
} from "@rdfjs/types";

export namespace Terms {
  export function deepCopy({
    dataFactory,
    term,
  }: { dataFactory: DataFactory; term: Term }): Term {
    switch (term.termType) {
      case "BlankNode":
        return dataFactory.blankNode(term.value);
      case "DefaultGraph":
        return dataFactory.defaultGraph();
      case "Literal":
        if (term.datatype.equals(xsd.string)) {
          if (term.language) {
            return dataFactory.literal(term.value, term.language);
          }
          return dataFactory.literal(term.value);
        }
        return dataFactory.literal(term.value, term.datatype);
      case "NamedNode":
        return dataFactory.namedNode(term.value);
      case "Quad":
        return dataFactory.quad(
          deepCopy({ dataFactory, term: term.subject }) as Quad_Subject,
          deepCopy({ dataFactory, term: term.predicate }) as Quad_Predicate,
          deepCopy({ dataFactory, term: term.object }) as Quad_Object,
          deepCopy({ dataFactory, term: term.graph }) as Quad_Graph,
        );
      case "Variable":
        throw new RangeError(`${term.termType} term not supported`);
    }
  }
}
