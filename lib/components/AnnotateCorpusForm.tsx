"use client";

import { ApiClient } from "@/lib/ApiClient";
import { ErrorAlert } from "@/lib/components/ErrorAlert";
import { WorkflowExecutionEventsViewer } from "@/lib/components/WorkflowExecutionEventsViewer";
import { WorkflowSelect } from "@/lib/components/WorkflowSelect";
import { Badge } from "@/lib/components/ui/badge";
import { Button } from "@/lib/components/ui/button";
import { Checkbox } from "@/lib/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/lib/components/ui/dialog";
import { LoadingSpinner } from "@/lib/components/ui/loading-spinner";
import {
  ClaimProperty,
  CorpusStub,
  Identifier,
  Locale,
  WorkflowExecutionEvent,
  WorkflowStub,
  displayLabel,
} from "@/lib/models";
import { useLocale, useTranslations } from "next-intl";
import React, { ReactElement, useCallback, useMemo, useState } from "react";

export function AnnotateCorpusForm(json: {
  claimProperties: readonly ReturnType<ClaimProperty["toJson"]>[];
  corpus: ReturnType<CorpusStub["toJson"]>;
  workflows: readonly ReturnType<WorkflowStub["toJson"]>[];
}) {
  const [abortedWorkflowExecution, setAbortedWorkflowExecution] =
    useState(false);
  const apiClient = useMemo(() => new ApiClient(), []);
  const corpus = useMemo(
    () => CorpusStub.fromJson(json.corpus).unsafeCoerce(),
    [json],
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const locale = useLocale() as Locale;
  const translations = useTranslations("AnnotateCorpusForm");
  const [selectedWorkflowIdentifier, setSelectedWorkflowIdentifier] =
    useState<string>("");
  const [
    skipPreviouslyAnnotatedDocuments,
    setSkipPreviouslyAnnotatedDocuments,
  ] = useState<boolean>(false);
  const [workflowExecutionEvents, setWorkflowExecutionEvents] = useState<
    readonly WorkflowExecutionEvent[]
  >([]);

  const annotateCorpus = useCallback(() => {
    setDialogOpen(true);
    setWorkflowExecutionEvents([]);

    (async () => {
      const error = (
        await apiClient.executeWorkflow({
          corpus,
          locale,
          onWorkflowExecutionEvent: (workflowExecutionEvent) => {
            setWorkflowExecutionEvents((prevWorkflowExecutionEvents) =>
              prevWorkflowExecutionEvents.concat(workflowExecutionEvent),
            );
          },
          skipPreviouslyAnnotatedDocuments,
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
    corpus,
    locale,
    selectedWorkflowIdentifier,
    skipPreviouslyAnnotatedDocuments,
  ]);

  const onClickAbortButton = useCallback(() => {
    apiClient.abortController.abort();
    setAbortedWorkflowExecution(true);
  }, [apiClient]);

  const onDialogOpenChange = useCallback(
    (open: boolean) => {
      setDialogOpen(open);
      if (!open) {
        apiClient.abortController.abort();
        setAbortedWorkflowExecution(true);
      }
    },
    [apiClient],
  );

  let dialogContent: ReactElement | null;
  if (error !== null) {
    dialogContent = <ErrorAlert error={error} />;
  } else if (workflowExecutionEvents.length > 0) {
    dialogContent = (
      <>
        <div className="flex flex-row justify-end w-full">
          {abortedWorkflowExecution ? (
            <Badge className="px-4 py-2" variant="destructive">
              {translations("Aborted")}
            </Badge>
          ) : (
            <Button onClick={onClickAbortButton} variant="destructive">
              {translations("Abort")}
            </Button>
          )}
        </div>
        <WorkflowExecutionEventsViewer
          abortedWorkflowExecution={abortedWorkflowExecution}
          claimProperties={json.claimProperties}
          workflowExecutionEvents={workflowExecutionEvents.map(
            (workflowExecutionEvent) => workflowExecutionEvent.toJson(),
          )}
        />
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-row gap-4 max-w-[50%]">
          <WorkflowSelect
            onSelect={setSelectedWorkflowIdentifier}
            selectedWorkflowIdentifier={selectedWorkflowIdentifier}
            workflows={json.workflows}
          />
          {selectedWorkflowIdentifier ? (
            <Button onClick={annotateCorpus}>{translations("Annotate")}</Button>
          ) : null}
        </div>
        {selectedWorkflowIdentifier ? (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={skipPreviouslyAnnotatedDocuments}
              id="skip-previously-annotated-documents-checkbox"
              onCheckedChange={(checkedState) =>
                setSkipPreviouslyAnnotatedDocuments(!!checkedState)
              }
            />
            <label
              htmlFor="skip-previously-annotaed-documents-checkbox"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {translations("Skip previously-annotated documents")}
            </label>
          </div>
        ) : null}
      </div>
      <Dialog open={dialogOpen} onOpenChange={onDialogOpenChange}>
        <DialogContent
          className="max-h-[95vh] max-w-[50vw] overflow-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {translations("Annotating corpus")}:{" "}
              {displayLabel(corpus, { locale })}
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
