import { Section } from "@/lib/components/Section";
import { WorkflowStepViewer } from "@/lib/components/WorkflowStepViewer";
import { Identifier, WorkflowStep } from "@/lib/models";
import { getTranslations } from "next-intl/server";
import React from "react";

export async function WorkflowStepsViewer({
  includeSubSteps,
  steps,
}: {
  includeSubSteps: boolean;
  steps: readonly WorkflowStep[];
}) {
  const translations = await getTranslations("WorkflowStepsViewer");
  return (
    <div className="flex flex-col gap-4 ps-2">
      {steps.map((step) => {
        let title: string;
        switch (step.type) {
          case "WorkflowQuestionnaireStep":
            title = translations("Questionnaire step");
            break;
        }
        return (
          <Section key={Identifier.toString(step.identifier)} title={title}>
            <WorkflowStepViewer includeSubSteps={includeSubSteps} step={step} />
          </Section>
        );
      })}
    </div>
  );
}
