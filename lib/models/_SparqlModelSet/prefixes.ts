import { dcterms, rdf, rdfs, skos, skosxl } from "@tpluscode/rdf-ns-builders";

export const prefixes = {
  dct: dcterms[""].value,
  rdf: rdf[""].value,
  rdfs: rdfs[""].value,
  skos: skos[""].value,
  "skos-xl": skosxl[""].value,
};
