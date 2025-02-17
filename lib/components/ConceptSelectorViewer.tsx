import { Link } from "@/lib/components/Link";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/lib/components/ui/table";
import { getHrefs } from "@/lib/getHrefs";
import {
  ConceptScheme,
  ConceptSelector,
  Identifier,
  SemanticRelationProperty,
  displayLabel,
} from "@/lib/models";
import { json } from "@/lib/models/impl";
import { getLocale, getTranslations } from "next-intl/server";
import React from "react";

export async function ConceptSelectorViewer({
  conceptSelector,
}: {
  conceptSelector: ConceptSelector;
}) {
  const hrefs = await getHrefs();
  const locale = await getLocale();
  const semanticRelationPropertyTranslations = await getTranslations(
    "SemanticRelationProperties",
  );
  const translations = await getTranslations("ConceptSelectorViewer");

  switch (conceptSelector.type) {
    case "ConceptSchemeConceptSelector":
    case "ConceptSchemeTopConceptSelector": {
      return (
        <>
          {translations("Concept scheme")}{" "}
          {conceptSelector.type === "ConceptSchemeConceptSelector"
            ? translations("concepts")
            : translations("top concepts")}
          {": "}
          <Link href={hrefs.conceptScheme(conceptSelector.conceptScheme)}>
            {displayLabel(conceptSelector.conceptScheme, { locale })}
          </Link>
        </>
      );
    }
    case "EnumeratedConceptSelector":
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <b>{translations("Enumerated concepts")}</b>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conceptSelector.concepts.map((concept) => (
              <Link
                href={hrefs.concept(concept)}
                key={Identifier.toString(concept.identifier)}
              >
                {displayLabel(concept, { locale })}
              </Link>
            ))}
          </TableBody>
        </Table>
      );
    case "NarrowerConceptSelector":
    case "NarrowerTransitiveConceptSelector": {
      return (
        <>
          {conceptSelector.type === "NarrowerConceptSelector"
            ? semanticRelationPropertyTranslations(
                SemanticRelationProperty.NARROWER.identifier.value as any,
              )
            : semanticRelationPropertyTranslations(
                SemanticRelationProperty.NARROWER_TRANSITIVE.identifier
                  .value as any,
              )}
          {": "}
          <Link href={hrefs.concept(conceptSelector.focusConcept)}>
            {displayLabel(conceptSelector.focusConcept, { locale })}
          </Link>
        </>
      );
    }
  }
}
