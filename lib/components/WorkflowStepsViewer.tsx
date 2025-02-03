import { Section } from "@/lib/components/Section";
import { WorkflowStepViewer } from "@/lib/components/WorkflowStepViewer";
import { Identifier, Workflow } from "@/lib/models";
import React from "react";

export function WorkflowStepsViewer({
  includeSubSteps,
  steps,
}: {
  includeSubSteps: boolean;
  steps: readonly WorkflowStep[];
}) {
  return (
    <div className="flex flex-col gap-4 ps-2">
      {steps.map((step) => (
        <Section
          key={Identifier.toString(step.identifier)}
          title={step.displayLabel}
        >
          <WorkflowStepViewer includeSubSteps={includeSubSteps} step={step} />
        </Section>
      ))}
    </div>
  );
}
