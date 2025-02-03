import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { ConceptAnnotatorExecutionViewer } from "@/lib/components/ConceptAnnotatorExecutionViewer";
import { DocumentAnnotationsDataTable } from "@/lib/components/DocumentAnnotationsDataTable";
import { DocumentViewer } from "@/lib/components/DocumentViewer";
import { Link } from "@/lib/components/Link";
import { ProcessViewer } from "@/lib/components/ProcessViewer";
import { Section } from "@/lib/components/Section";
import { WorkflowStepViewer } from "@/lib/components/WorkflowStepViewer";
import { getHrefs } from "@/lib/getHrefs";
import { logger } from "@/lib/logger";
import {
  Identifier,
  ModelSet,
  Workflow,
  WorkflowExecution,
  WorkflowStep,
  WorkflowStepExecution,
} from "@/lib/models";
import { getTranslations } from "next-intl/server";
import React from "react";

async function StepExecutionsViewer({
  stepExecutions,
  steps,
}: {
  stepExecutions: readonly WorkflowStepExecution[];
  steps: readonly WorkflowStep[];
}) {
  return (
    <div className="flex flex-col gap-4 ps-2">
      {stepExecutions.map(async (stepExecution) => {
        const stepIdentifier = stepExecution.input.identifier;
        const step = steps.find((step) =>
          step.identifier.equals(stepIdentifier),
        );
        if (!step) {
          logger.warn(
            "unable to resolve step %s",
            Identifier.toString(stepIdentifier),
          );
          return;
        }

        return (
          <Section
            key={Identifier.toString(stepExecution.identifier)}
            title={Identifier.toString(stepExecution.identifier)}
          >
            <StepExecutionViewer step={step} stepExecution={stepExecution} />
          </Section>
        );
      })}
    </div>
  );
}

async function StepExecutionViewer({
  step,
  stepExecution,
}: {
  step: WorkflowStep;
  stepExecution: WorkflowStepExecution;
}) {
  const translations = await getTranslations("StepExecutionViewer");

  return (
    <ProcessViewer<
      WorkflowStepExecution["input"],
      void,
      WorkflowStepExecution["subProcesses"]
    >
      process={stepExecution}
      renderInput={async () => [
        {
          title: translations("Step"),
          content: (
            <WorkflowStepViewer
              includeSubSteps={false}
              key="step"
              step={step}
            />
          ),
        },
      ]}
      renderOutput={async (annotations) => [
        {
          title: translations("Annotations"),
          content: (
            <ClientProvidersServer>
              <DocumentAnnotationsDataTable
                annotations={
                  await Promise.all(annotations.map(json.Annotation.clone))
                }
                annotationsEvaluation={null}
                key="annotations"
              />
            </ClientProvidersServer>
          ),
        },
      ]}
      renderSubProcesses={async () => {
        const subProcessSections: {
          content: React.ReactElement;
          title: string;
        }[] = [];
        if (stepExecution.type === "WorkflowConceptAnnotatorStepExecution") {
          stepExecution.subProcesses.conceptAnnotatorExecution.ifJust(
            (conceptAnnotatorExecution) => {
              subProcessSections.push({
                title: conceptAnnotatorExecution.type,
                content: (
                  <ConceptAnnotatorExecutionViewer
                    conceptAnnotatorExecution={conceptAnnotatorExecution}
                  />
                ),
              });
            },
          );
        }
        const subStepExecutions = stepExecution.subProcesses.subStepExecutions;
        if (subStepExecutions.length > 0) {
          subProcessSections.push({
            title: translations("Sub-step executions"),
            content: (
              <StepExecutionsViewer
                stepExecutions={subStepExecutions}
                steps={step.subSteps}
              />
            ),
          });
        }
        return subProcessSections;
      }}
    />
  );
}

export async function WorkflowExecutionViewer({
  modelSet,
  workflow,
  workflowExecution,
}: {
  modelSet: ModelSet;
  workflow: Workflow;
  workflowExecution: WorkflowExecution;
}) {
  const hrefs = await getHrefs();
  const translations = await getTranslations("WorkflowExecutionViewer");

  const documentStub = workflowExecution.input.document;
  const documentLink = (
    <Link href={hrefs.document(documentStub)}>
      {documentStub.title
        .map((title) => title.literalForm)
        .orDefault(Identifier.toString(documentStub.identifier))}
    </Link>
  );
  const documentEither = await modelSet.document(documentStub.identifier);

  return (
    <>
      <ProcessViewer
        process={workflowExecution}
        renderInput={async () => {
          return [
            {
              key: "document",
              title:
                documentEither !== null ? (
                  <span>
                    {translations("Document")}: {documentLink}
                  </span>
                ) : (
                  documentLink
                ),
              content: documentEither.isRight() ? (
                <DocumentViewer
                  document={documentEither.unsafeCoerce()}
                  includeAnnotations={false}
                />
              ) : (
                documentLink
              ),
            },
          ];
        }}
        renderOutput={async () => []}
        renderSubProcesses={async (subProcesses) => [
          {
            title: translations("Steps"),
            content: (
              <StepExecutionsViewer
                stepExecutions={subProcesses}
                steps={workflow.steps}
              />
            ),
          },
        ]}
      />
    </>
  );
}
