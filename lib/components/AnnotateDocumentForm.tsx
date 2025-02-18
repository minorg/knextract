"use client";

import { ApiClient } from "@/lib/ApiClient";
import { DocumentAnnotationsDataTable } from "@/lib/components/DocumentClaimsDataTable";
import { ErrorAlert } from "@/lib/components/ErrorAlert";
import { Section } from "@/lib/components/Section";
import { WorkflowExecutionEventsViewer } from "@/lib/components/WorkflowExecutionEventsViewer";
import { WorkflowSelect } from "@/lib/components/WorkflowSelect";
import { Button } from "@/lib/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/lib/components/ui/dialog";
import { LoadingSpinner } from "@/lib/components/ui/loading-spinner";
import { useHrefs } from "@/lib/hooks";
import {
  Claim,
  ClaimsEvaluation,
  DocumentStub,
  Identifier,
  Locale,
  WorkflowExecutionEvent,
  WorkflowStub,
  claims,
} from "@/lib/models";
import { evaluateClaims } from "@/lib/utilities";
import { useLocale, useTranslations } from "next-intl";
import React, { ReactElement, useCallback, useMemo, useState } from "react";
import { Link } from "./Link";

export function AnnotateDocumentForm({
  document: documentJson,
  onAnnotateDocument,
  workflows: workflowsJson,
}: {
  document: ReturnType<DocumentStub["toJson"]>;
  onAnnotateDocument: (kwds: {
    claims: readonly ReturnType<Claim["toJson"]>[];
    claimsEvaluation: ClaimsEvaluation | null;
  }) => void;
  workflows: readonly ReturnType<WorkflowStub["toJson"]>[];
}) {
  const apiClient = useMemo(() => new ApiClient(), []);
  const document = useMemo(
    () => DocumentStub.fromJson(documentJson).unsafeCoerce(),
    [documentJson],
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const workflows = useMemo(
    () =>
      workflowsJson.flatMap((json) =>
        WorkflowStub.fromJson(json).toMaybe().toList(),
      ),
    [workflowsJson],
  );
  const [workflowExecutionEvents, setWorkflowExecutionEvents] = useState<
    readonly WorkflowExecutionEvent[]
  >([]);

  const hrefs = useHrefs();
  const locale = useLocale() as Locale;
  const translations = useTranslations("AnnotateDocumentForm");
  const [selectedWorkflowIdentifier, setSelectedWorkflowIdentifier] =
    useState<string>("");

  const annotateDocument = useCallback(() => {
    setDialogOpen(true);
    setWorkflowExecutionEvents([]);

    (async () => {
      const error = (
        await apiClient.executeWorkflow({
          document,
          locale,
          onWorkflowExecutionEvent: (workflowExecutionEvent) => {
            setWorkflowExecutionEvents((prevWorkflowExecutionEvents) =>
              prevWorkflowExecutionEvents.concat(workflowExecutionEvent),
            );

            if (workflowExecutionEvent.type === "PostWorkflowExecutionEvent") {
              const workflowExecutionClaims = claims(
                workflowExecutionEvent.payload,
              );
              onAnnotateDocument({
                claims: workflowExecutionClaims.map((claim) => claim.toJson()),
                claimsEvaluation: evaluateClaims(workflowExecutionClaims),
              });
            }
          },
          workflow: {
            identifier: Identifier.fromString(selectedWorkflowIdentifier),
          },
        })
      ).extract();
      if (error !== null) {
        setError(error);
      }
    })();
  }, [
    apiClient,
    document,
    locale,
    selectedWorkflowIdentifier,
    onAnnotateDocument,
  ]);

  const workflowPostExecutionEvent = workflowExecutionEvents.find(
    (workflowExecutionEvent) =>
      workflowExecutionEvent.type === "PostWorkflowExecutionEvent",
  );

  let dialogContent: ReactElement | null;
  if (error !== null) {
    dialogContent = <ErrorAlert error={error} />;
  } else if (workflowExecutionEvents.length > 0) {
    let workflowExecutionIdentifier: Identifier | undefined;
    let workflowIdentifier: Identifier | undefined;
    for (const workflowExecutionEvent of workflowExecutionEvents) {
      switch (workflowExecutionEvent.type) {
        case "PostWorkflowExecutionEvent": {
          workflowExecutionIdentifier =
            workflowExecutionEvent.payload.identifier;
          workflowIdentifier = workflowExecutionEvent.payload.input.identifier;
          break;
        }
        case "PreWorkflowExecutionEvent": {
          workflowExecutionIdentifier =
            workflowExecutionEvent.payload.identifier;
          workflowIdentifier = workflowExecutionEvent.payload.identifier;
          break;
        }
      }
    }

    dialogContent = (
      <>
        <Section
          className="w-full"
          title={
            workflowIdentifier && workflowExecutionIdentifier ? (
              <Link
                href={hrefs.workflowExecution({
                  workflowExecutionIdentifier,
                  workflowIdentifier,
                })}
              >
                {translations("Workflow execution")}
              </Link>
            ) : (
              <span>{translations("Workflow execution")}</span>
            )
          }
        >
          <WorkflowExecutionEventsViewer
            abortedWorkflowExecution={false}
            workflowExecutionEvents={workflowExecutionEvents}
          />
        </Section>
        {workflowPostExecutionEvent ? (
          <Section
            className="w-full"
            title={translations("Cumulative annotations")}
          >
            <DocumentAnnotationsDataTable
              annotations={workflowPostExecutionEvent.cumulativeAnnotations}
              annotationsEvaluation={
                workflowPostExecutionEvent.cumulativeAnnotationsEvaluation
              }
              excludeHeader
              key="right"
            />
          </Section>
        ) : null}
      </>
    );
  } else {
    dialogContent = (
      <div className="flex flex-row items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-row gap-4 max-w-[50%]">
        <WorkflowSelect
          onSelect={setSelectedWorkflowIdentifier}
          selectedWorkflowIdentifier={selectedWorkflowIdentifier}
          workflows={workflows}
        />
        {selectedWorkflowIdentifier ? (
          <Button onClick={annotateDocument}>{translations("Annotate")}</Button>
        ) : null}
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-h-[95vh] max-w-[50vw] overflow-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              <span>
                {translations("Annotating document")}: {document.displayLabel}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 items-center justify-center w-full">
            {dialogContent}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
