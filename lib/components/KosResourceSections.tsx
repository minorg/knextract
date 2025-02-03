import { Section } from "@/lib/components/Section";
import { Concept, ConceptScheme, Label } from "@/lib/models";
import { getTranslations } from "next-intl/server";
import React from "react";
import { skos } from "../vocabularies";

export async function KosResourceSections({
  model,
}: {
  model: Concept | ConceptScheme;
}) {
  const sections: React.ReactElement[] = [];

  const translations = await getTranslations("LabelTypes");

  for (const labelType of Label.Types) {
    const labels = model.labels({ types: [labelType] });
    if (
      labels.length === 0 ||
      (labelType.literalProperty.equals(skos.prefLabel) && labels.length === 1)
    ) {
      continue;
    }
    sections.push(
      <Section title={translations(labelType.literalProperty.value as any)}>
        <ul className="list-disc list-inside">
          {labels.map((label, labelI) => (
            <li key={labelI}>{label.literalForm.value}</li>
          ))}
        </ul>
      </Section>,
    );
  }
  return sections;
}
