"use client";

import { useHrefs } from "@/lib/hooks";
import { Identifier, WorkflowExecutionStub, WorkflowStub } from "@/lib/models";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { DataTable } from "./DataTable";
import { Link } from "./Link";

const columnHelper = createColumnHelper<WorkflowExecutionStub>();

export function WorkflowExecutionsDataTable(json: {
  workflowExecutions: ReturnType<WorkflowExecutionStub["toJson"]>[];
  workflow: { identifier: string };
}) {
  const hrefs = useHrefs();
  const translations = useTranslations("WorkflowExecutionsDataTable");
  const workflowExecutions = json.workflowExecutions.flatMap(
    (workflowExecutionJson) =>
      WorkflowExecutionStub.fromJson(workflowExecutionJson).toMaybe().toList(),
  );
  const workflow = new WorkflowStub({
    identifier: Identifier.fromString(json.workflow.identifier),
  });

  const columns: ColumnDef<WorkflowExecutionStub, any>[] = [
    columnHelper.accessor("startedAtTime", {
      cell: (context) =>
        context.row.original.startedAtTime
          ? new Date(context.row.original.startedAtTime).toISOString()
          : "",
      enableColumnFilter: false,
      enableSorting: true,
      header: () => translations("Started at time"),
      sortingFn: (left, right) =>
        left.original.endedAtTime.map((date) => date.getTime()).orDefault(0) -
        right.original.endedAtTime.map((date) => date.getTime()).orDefault(0),
    }),
    columnHelper.accessor("endedAtTime", {
      cell: (context) =>
        context.row.original.endedAtTime
          ?.map((date) => date.toISOString())
          .orDefault(""),
      enableColumnFilter: false,
      enableSorting: true,
      header: () => translations("Ended at time"),
      sortingFn: (left, right) =>
        left.original.endedAtTime
          .map((date) => date.getTime())
          .orDefault(Number.MAX_SAFE_INTEGER) -
        right.original.endedAtTime
          .map((date) => date.getTime())
          .orDefault(Number.MAX_SAFE_INTEGER),
    }),
    columnHelper.accessor("identifier", {
      cell: (context) => (
        <Link
          href={hrefs.workflowExecution({
            workflowExecutionIdentifier: context.row.original.identifier,
            workflowIdentifier: workflow.identifier,
          })}
        >
          <Info className="h-4 w-4" />
        </Link>
      ),
      enableColumnFilter: false,
      enableSorting: false,
      header: () => "",
      sortingFn: (rowA, rowB) =>
        Identifier.toString(rowA.original.identifier).localeCompare(
          Identifier.toString(rowB.original.identifier),
        ),
    }),
  ];

  return (
    <DataTable
      columns={columns}
      data={workflowExecutions}
      pagination={{ pageIndex: 0, pageSize: 10 }}
    />
  );
}
