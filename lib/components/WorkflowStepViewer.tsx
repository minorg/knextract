import { QuestionnaireViewer } from "@/lib/components/QuestionnaireViewer";
import { Section } from "@/lib/components/Section";
import { WorkflowStep, displayLabel } from "@/lib/models";
import { getLocale, getTranslations } from "next-intl/server";
import React, { ReactElement } from "react";

export async function WorkflowStepViewer({
  step,
}: {
  includeSubSteps: boolean;
  step: WorkflowStep;
}) {
  const locale = await getLocale();
  const translations = await getTranslations("WorkflowStepViewer");

  const sections: ReactElement[] = [];

  switch (step.type) {
    case "WorkflowQuestionnaireStep": {
      step.languageModel.ifJust((languageModel) => {
        sections.push(
          <Section key="languageModel" title={translations("Language model")}>
            {displayLabel(languageModel, { locale })}
          </Section>,
        );
      });

      sections.push(
        <Section key="questionnaire" title={translations("Questionnaire")}>
          <QuestionnaireViewer
            key={sections.length}
            questionnaire={step.questionnaire}
          />
        </Section>,
      );

      break;
    }
  }

  return <div className="flex flex-col gap-4">{sections}</div>;
}
