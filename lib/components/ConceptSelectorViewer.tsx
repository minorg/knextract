import { Link } from "@/lib/components/Link";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/lib/components/ui/table";
import { getHrefs } from "@/lib/getHrefs";
import { ConceptSelector, SemanticRelation, StubSequence } from "@/lib/models";
import { json } from "@/lib/models/impl";
import { getTranslations } from "next-intl/server";
import React from "react";

export async function ConceptSelectorViewer({
  conceptSelector,
}: {
  conceptSelector: ConceptSelector;
}) {
  const hrefs = await getHrefs();
  const semanticRelationTypeTranslations = await getTranslations(
    "SemanticRelationTypes",
  );
  const translations = await getTranslations("ConceptSelectorViewer");

  switch (conceptSelector.type) {
    case "ConceptSchemeConceptSelector":
    case "ConceptSchemeTopConceptSelector": {
      const conceptScheme = (await conceptSelector.conceptScheme.resolve())
        .map(json.ConceptScheme.clone)
        .mapLeft(json.ConceptScheme.missing)
        .extract();
      return (
        <>
          {translations("Concept scheme")}{" "}
          {conceptSelector.type === "ConceptSchemeConceptSelector"
            ? translations("concepts")
            : translations("top concepts")}
          {": "}
          <Link href={hrefs.conceptScheme(conceptScheme)}>
            {conceptScheme.displayLabel}
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
            {(
              await Promise.all(
                (
                  await StubSequence.fromStubs(
                    conceptSelector.concepts,
                  ).resolve()
                ).map((concept) =>
                  concept
                    .map(json.Concept.clone)
                    .mapLeft(json.Concept.missing)
                    .extract(),
                ),
              )
            ).map((concept) => (
              <Link href={hrefs.concept(concept)} key={concept.identifier}>
                {concept.displayLabel}
              </Link>
            ))}
          </TableBody>
        </Table>
      );
    case "NarrowerConceptSelector":
    case "NarrowerTransitiveConceptSelector": {
      const concept = await (await conceptSelector.focusConcept.resolve())
        .map(json.Concept.clone)
        .mapLeft(json.Concept.missing)
        .extract();
      return (
        <>
          {conceptSelector.type === "NarrowerConceptSelector"
            ? semanticRelationTypeTranslations(
                SemanticRelation.Type.NARROWER.property.value as any,
              )
            : semanticRelationTypeTranslations(
                SemanticRelation.Type.NARROWER_TRANSITIVE.property.value as any,
              )}
          {": "}
          <Link href={hrefs.concept(concept)}>{concept.displayLabel}</Link>
        </>
      );
    }
  }
}
