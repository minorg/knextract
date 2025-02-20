"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import { Identifier, WorkflowStub, displayLabel } from "@/lib/models";
import { useLocale, useTranslations } from "next-intl";
import React, { useMemo } from "react";

export function WorkflowSelect({
  onSelect,
  selectedWorkflowIdentifier,
  workflows: workflowsJson,
}: {
  onSelect: (workflowIdentifier: string) => void;
  selectedWorkflowIdentifier: string;
  workflows: readonly ReturnType<WorkflowStub["toJson"]>[];
}) {
  const locale = useLocale();
  const translations = useTranslations("WorkflowSelect");
  const placeholder = translations("Select a workflow");
  const workflows = useMemo(
    () =>
      workflowsJson.flatMap((json) =>
        WorkflowStub.fromJson(json).toMaybe().toList(),
      ),
    [workflowsJson],
  );

  return (
    <div className="flex flex-row justify-end">
      <div
        style={{
          width: `${placeholder.length}rem`,
        }}
      >
        <Select onValueChange={onSelect} value={selectedWorkflowIdentifier}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {workflows.map((workflow, workflowI) => (
              <SelectItem
                key={workflowI}
                value={Identifier.toString(workflow.identifier)}
              >
                {displayLabel(workflow, { locale })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
