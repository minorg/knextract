import { ConceptAnnotatorParametersViewer } from "@/lib/components/ConceptAnnotatorParametersViewer";
import { ConceptSelectorViewer } from "@/lib/components/ConceptSelectorViewer";
import { Section } from "@/lib/components/Section";
import { WorkflowStepsViewer } from "@/lib/components/WorkflowStepsViewer";
import { Workflow } from "@/lib/models";
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

  parts.push(
    <span className="text-sm" key={parts.length}>
      <b>{translations("Priority")}</b>: {step.priority}
    </span>,
  );

  switch (step.type) {
    case "WorkflowConceptAnnotatorStep": {
      if (step.recursive) {
        parts.push(
          <span className="text-sm" key={parts.length}>
            <b>{translations("Recursive")}</b>
          </span>,
        );
      }

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
    case "WorkflowSuperStep":
      break;
  }

  if (includeSubSteps && step.subSteps.length > 0) {
    parts.push(
      <WorkflowStepsViewer
        includeSubSteps={includeSubSteps}
        steps={step.subSteps}
        key={parts.length}
      />,
    );
  }

  return <div className="flex flex-col gap-4">{parts}</div>;
}
