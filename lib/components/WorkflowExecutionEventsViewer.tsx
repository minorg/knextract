"use client";

import { DocumentAnnotationsDataTable } from "@/lib/components/DocumentAnnotationsDataTable";
import { ExceptionAlert } from "@/lib/components/ExceptionAlert";
import { Section } from "@/lib/components/Section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/lib/components/ui/accordion";
import { Badge } from "@/lib/components/ui/badge";
import { LoadingSpinner } from "@/lib/components/ui/loading-spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/lib/components/ui/table";
import {
  PostWorkflowExecutionEvent,
  PostWorkflowStepExecutionEvent,
  PreWorkflowExecutionEvent,
  PreWorkflowStepExecutionEvent,
  WorkflowExecutionEvent,
  displayLabel,
} from "@/lib/models";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

interface GroupedWorkflowExecutionEvents {
  post?: PostWorkflowExecutionEvent;
  readonly pre: PreWorkflowExecutionEvent;
  steps: {
    post?: PostWorkflowStepExecutionEvent;
    readonly pre: PreWorkflowStepExecutionEvent;
  }[];
}

function GroupedWorkflowExecutionEventsViewer({
  abortedWorkflowExecution,
  groupedWorkflowExecutionEvents,
}: {
  abortedWorkflowExecution: boolean;
  groupedWorkflowExecutionEvents: GroupedWorkflowExecutionEvents;
}) {
  const locale = useLocale();
  const translations = useTranslations("WorkflowExecutionEventsViewer");

  return (
    <Accordion className="w-full" type="single" collapsible>
      <AccordionItem
        value={Identifier.toString(
          groupedWorkflowExecutionEvents.pre.identifier,
        )}
      >
        <AccordionTrigger className="w-full">
          <div className="flex flex-row gap-4">
            <div>
              <span>{translations("Document")}:</span>
              <span>
                {" "}
                {displayLabel({
                  locale,
                  model: groupedWorkflowExecutionEvents.pre.payload.document,
                })}
              </span>
            </div>
            {groupedWorkflowExecutionEvents.post ? null : (
              <div className="flex flex-col items-center justify-center">
                {abortedWorkflowExecution ? (
                  <Badge className="px-2 py-1" variant="destructive">
                    {translations("Aborted")}
                  </Badge>
                ) : (
                  <LoadingSpinner className="h-4 w-4" />
                )}
              </div>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="border-dotted border-gray-600 border-2 flex flex-col gap-2 items-center justify-center p-4 rounded">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translations("Started at")}</TableHead>
                  <TableHead>{translations("Ended at")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    {new Date(
                      groupedWorkflowExecutionEvents.pre.workflowExecution
                        .startedAtTime,
                    ).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {groupedWorkflowExecutionEvents.post ? (
                      new Date(
                        groupedWorkflowExecutionEvents.post!.endedAtTime.unsafeCoerce(),
                      ).toLocaleString()
                    ) : abortedWorkflowExecution ? (
                      <Badge className="px-2 py-1" variant="destructive">
                        {translations("Aborted")}
                      </Badge>
                    ) : (
                      <LoadingSpinner className="h-4 w-4" />
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            {groupedWorkflowExecutionEvents.steps.length > 0 ? (
              <Section
                className="w-full"
                title={translations("Step executions")}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{translations("Type")}</TableHead>
                      <TableHead>{translations("Started at")}</TableHead>
                      <TableHead>{translations("Ended at")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedWorkflowExecutionEvents.steps.map((step) => (
                      <TableRow key={step.pre.stepExecution.identifier}>
                        <TableCell>{step.pre.stepExecution.type}</TableCell>
                        <TableCell>
                          {new Date(
                            step.pre.stepExecution.startedAtTime,
                          ).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {step.post ? (
                            new Date(
                              step.post.stepExecution.endedAtTime!,
                            ).toLocaleString()
                          ) : abortedWorkflowExecution ? (
                            <Badge className="px-2 py-1" variant="destructive">
                              {translations("Aborted")}
                            </Badge>
                          ) : (
                            <LoadingSpinner className="h-4 w-4" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Section>
            ) : null}
            {groupedWorkflowExecutionEvents.post ? (
              groupedWorkflowExecutionEvents.post.workflowExecution
                .exception ? (
                <Section className="w-full" title={translations("Exception")}>
                  <ExceptionAlert
                    exception={
                      groupedWorkflowExecutionEvents.post.workflowExecution
                        .exception!
                    }
                  />
                </Section>
              ) : (
                <Section className="w-full" title={translations("Results")}>
                  <DocumentAnnotationsDataTable
                    annotations={
                      groupedWorkflowExecutionEvents.post.workflowExecution
                        .output!
                    }
                    annotationsEvaluation={null}
                    excludeHeader={true}
                  />
                </Section>
              )
            ) : null}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function WorkflowExecutionEventsViewer(json: {
  abortedWorkflowExecution: boolean;
  workflowExecutionEvents: readonly ReturnType<
    typeof WorkflowExecutionEvent.toJson
  >[];
}) {
  const groupedWorkflowExecutionEvents = useMemo(() => {
    const groupedWorkflowExecutionEvents: GroupedWorkflowExecutionEvents[] = [];
    for (const workflowExecutionEvent of json.workflowExecutionEvents.flatMap(
      (workflowExecutionEventJson) =>
        WorkflowExecutionEvent.fromJson(workflowExecutionEventJson)
          .toMaybe()
          .toList(),
    )) {
      switch (workflowExecutionEvent.type) {
        case "PostWorkflowExecutionEvent":
          groupedWorkflowExecutionEvents.at(-1)!.post = workflowExecutionEvent;
          break;
        case "WorkflowPostStepExecutionEvent":
          groupedWorkflowExecutionEvents.at(-1)!.steps.at(-1)!.post =
            workflowExecutionEvent;
          break;
        case "WorkflowPreExecutionEvent":
          groupedWorkflowExecutionEvents.push({
            pre: workflowExecutionEvent,
            steps: [],
          });
          break;
        case "WorkflowPreStepExecutionEvent":
          groupedWorkflowExecutionEvents.at(-1)!.steps.push({
            pre: workflowExecutionEvent,
          });
          break;
      }
    }
    return groupedWorkflowExecutionEvents;
  }, [json.workflowExecutionEvents]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {groupedWorkflowExecutionEvents.map((groupedWorkflowExecutionEvents) => (
        <GroupedWorkflowExecutionEventsViewer
          abortedWorkflowExecution={abortedWorkflowExecution}
          key={groupedWorkflowExecutionEvents.pre.workflowExecution.identifier}
          groupedWorkflowExecutionEvents={groupedWorkflowExecutionEvents}
        />
      ))}
    </div>
  );
}
