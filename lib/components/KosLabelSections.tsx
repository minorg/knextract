import { Section } from "@/lib/components/Section";
import {
  KosLabel,
  KosLabelProperty,
  KosResource,
  kosLabels,
} from "@/lib/models";
import { getTranslations } from "next-intl/server";
import React from "react";

function KosLabelSection({
  kosLabels,
  title,
}: { kosLabels: readonly KosLabel[]; title: string }) {
  return (
    <Section title={title}>
      <ul className="list-disc list-inside">
        {kosLabels.flatMap((kosLabel, kosLabelI) =>
          kosLabel.literalForm.map((literalForm, literalFormI) => (
            <li key={`${kosLabelI}-${literalFormI}`}>{literalForm.value}</li>
          )),
        )}
      </ul>
    </Section>
  );
}

export async function KosLabelSections({
  kosResource,
}: { kosResource: KosResource }) {
  const sections: React.ReactElement[] = [];
  const labels_ = kosLabels(kosResource);
  const labelPropertyTranslations = await getTranslations("KosLabelProperties");

  if (labels_.alternative.length > 0) {
    sections.push(
      <KosLabelSection
        kosLabels={labels_.alternative}
        title={labelPropertyTranslations(
          KosLabelProperty.ALT.translationKey as any,
        )}
      />,
    );
  }

  if (labels_.hidden.length > 0) {
    sections.push(
      <KosLabelSection
        kosLabels={labels_.hidden}
        title={labelPropertyTranslations(
          KosLabelProperty.HIDDEN.translationKey as any,
        )}
      />,
    );
  }

  return sections;
}
