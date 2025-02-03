"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import { json } from "@/lib/models/impl";
import { useTranslations } from "next-intl";
import React from "react";

export function WorkflowSelect({
  onSelect,
  selectedWorkflowIdentifier,
  workflows,
}: {
  onSelect: (workflowIdentifier: string) => void;
  selectedWorkflowIdentifier: string;
  workflows: readonly json.Workflow[];
}) {
  const translations = useTranslations("WorkflowSelect");
  const placeholder = translations("Select a workflow");

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
              <SelectItem key={workflowI} value={workflow.identifier}>
                {workflow.displayLabel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
