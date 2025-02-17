import { ConceptSelectorViewer } from "@/lib/components/ConceptSelectorViewer";
import { ConceptAnnotatorParametersViewer } from "@/lib/components/LanguageModelSpecificationViewer";
import { Section } from "@/lib/components/Section";
import { WorkflowStepsViewer } from "@/lib/components/WorkflowStepsViewer";
import { WorkflowStep } from "@/lib/models";
import { getTranslations } from "next-intl/server";
import React, { ReactElement } from "react";

export async function WorkflowStepViewer({
  includeSubSteps,
  step,
}: {
  includeSubSteps: boolean;
  step: WorkflowStep;
}) {
  const translations = await getTranslations("WorkflowStepViewer");

  const parts: ReactElement[] = [];

  switch (step.type) {
    case "WorkflowQuestionnaireStep": {
      parts.push(
        <ConceptAnnotatorParametersViewer
          conceptAnnotatorParameters={step.conceptAnnotatorParameters}
          key={parts.length}
        />,
      );

      parts.push(
        <Section key={parts.length} title={translations("Concept selector")}>
          <ConceptSelectorViewer conceptSelector={step.conceptSelector} />
        </Section>,
      );

      break;
    }
  }

  return <div className="flex flex-col gap-4">{parts}</div>;
}
