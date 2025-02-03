import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { Section } from "@/lib/components/Section";
import { WorkflowExecutionsDataTable } from "@/lib/components/WorkflowExecutionsDataTable";
import { WorkflowStepsViewer } from "@/lib/components/WorkflowStepsViewer";
import { Identifier, ModelSet, Workflow } from "@/lib/models";
import { getTranslations } from "next-intl/server";
import React from "react";

export async function WorkflowViewer({
  modelSet,
  workflow,
}: {
  modelSet: ModelSet;
  workflow: Workflow;
}) {
  const executions = (
    await modelSet.workflowExecutionStubs({
      query: { type: "Workflow", workflowIdentifier: workflow.identifier },
    })
  ).orDefault([]);

  const translations = await getTranslations("WorkflowViewer");

  return (
    <div className="flex flex-col gap-4">
      <Section title={translations("Steps")}>
        <WorkflowStepsViewer includeSubSteps={true} steps={workflow.steps} />
      </Section>
      {executions.length > 0 ? (
        <Section title={translations("Executions")}>
          <ClientProvidersServer>
            <WorkflowExecutionsDataTable
              workflowExecutions={executions.concat()}
              workflowIdentifier={Identifier.toString(workflow.identifier)}
            />
          </ClientProvidersServer>
        </Section>
      ) : null}
    </div>
  );
}
