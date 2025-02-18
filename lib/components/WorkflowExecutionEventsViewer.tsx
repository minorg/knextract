"use client";

import { DocumentAnnotationsDataTable } from "@/lib/components/DocumentClaimsDataTable";
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
  Identifier,
  PostWorkflowExecutionEvent,
  PostWorkflowStepExecutionEvent,
  PreWorkflowExecutionEvent,
  PreWorkflowStepExecutionEvent,
  WorkflowExecutionEvent,
  claims,
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
                {displayLabel(
                  groupedWorkflowExecutionEvents.pre.payload.document,
                  {
                    locale,
                  },
                )}
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
                      groupedWorkflowExecutionEvents.pre.timestamp,
                    ).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {groupedWorkflowExecutionEvents.post ? (
                      groupedWorkflowExecutionEvents.post!.timestamp.toLocaleString()
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
                      <TableRow key={Identifier.toString(step.pre.identifier)}>
                        <TableCell>{step.pre.payload.type}</TableCell>
                        <TableCell>
                          {step.pre.timestamp.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {step.post ? (
                            step.post.timestamp.toLocaleString()
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
              groupedWorkflowExecutionEvents.post.payload.output.type ===
              "Exception" ? (
                <Section className="w-full" title={translations("Exception")}>
                  <ExceptionAlert
                    exception={
                      groupedWorkflowExecutionEvents.post.payload.output
                    }
                  />
                </Section>
              ) : (
                <Section className="w-full" title={translations("Results")}>
                  <DocumentClaimsDataTable
                    claims={claims(
                      groupedWorkflowExecutionEvents.post.payload,
                    ).map((claim) => claim.toJson())}
                    claimsEvaluation={null}
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
  workflowExecutionEvents: readonly WorkflowExecutionEvent[];
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
        case "PostWorkflowStepExecutionEvent":
          groupedWorkflowExecutionEvents.at(-1)!.steps.at(-1)!.post =
            workflowExecutionEvent;
          break;
        case "PreWorkflowExecutionEvent":
          groupedWorkflowExecutionEvents.push({
            pre: workflowExecutionEvent,
            steps: [],
          });
          break;
        case "PreWorkflowStepExecutionEvent":
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
          abortedWorkflowExecution={json.abortedWorkflowExecution}
          key={Identifier.toString(
            groupedWorkflowExecutionEvents.pre.identifier,
          )}
          groupedWorkflowExecutionEvents={groupedWorkflowExecutionEvents}
        />
      ))}
    </div>
  );
}
