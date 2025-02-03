import { PromptTemplateViewer } from "@/lib/components/PromptTemplateViewer";
import { Section } from "@/lib/components/Section";
import { ConceptAnnotatorParameters } from "@/lib/models";
import { json } from "@/lib/models/impl";
import { getTranslations } from "next-intl/server";
import { MaybeAsync } from "purify-ts";
import React from "react";
import invariant from "ts-invariant";

export async function ConceptAnnotatorParametersViewer({
  conceptAnnotatorParameters,
}: {
  conceptAnnotatorParameters: ConceptAnnotatorParameters;
}) {
  const translations = await getTranslations(
    "ConceptAnnotatorParametersViewer",
  );

  let annotatorDisplayLabel: string = conceptAnnotatorParameters.type;
  invariant(annotatorDisplayLabel.endsWith("Parameters"));
  annotatorDisplayLabel = annotatorDisplayLabel.slice(
    0,
    annotatorDisplayLabel.length - "Parameters".length,
  );

  const sectionTitle = `${translations("Annotator")}: ${annotatorDisplayLabel}`;

  switch (conceptAnnotatorParameters.type) {
    case "EveryConceptAnnotatorParameters":
      return <span>{sectionTitle}</span>;
    case "LanguageModelConceptAnnotatorParameters": {
      const languageModel = await MaybeAsync(async ({ liftMaybe }) => {
        const languageModelStub = await liftMaybe(
          conceptAnnotatorParameters.languageModel,
        );
        return (await languageModelStub.resolve())
          .mapLeft(() => ({
            ...json.Model.clone({
              identifier: languageModelStub.identifier,
              type: "LanguageModel",
            }),
            displayLabel: translations("Missing language model"),
          }))
          .map(json.LanguageModelSpecification.clone)
          .extract();
      }).run();

      return (
        <Section title={sectionTitle}>
          <Section title={translations("Language model")}>
            {languageModel
              .map((languageModel) => languageModel.displayLabel)
              .orDefault(translations("Default"))}
          </Section>
          <Section title={translations("Prompt template")}>
            {conceptAnnotatorParameters.promptTemplate
              .map((promptTemplate) => (
                <PromptTemplateViewer
                  key="prompt-template"
                  promptTemplate={promptTemplate}
                />
              ))
              .orDefault(<span>{translations("Default")}</span>)}
          </Section>
        </Section>
      );
    }
  }
}
