"use client";

import { useHrefs } from "@/lib/hooks";
import { Identifier, WorkflowStub, displayLabel } from "@/lib/models";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { DataTable } from "./DataTable";
import { Link } from "./Link";

const columnHelper = createColumnHelper<WorkflowStub>();

export function WorkflowsDataTable(json: {
  workflows: ReturnType<WorkflowStub["toJson"]>[];
}) {
  const hrefs = useHrefs();
  const locale = useLocale();
  const translations = useTranslations("WorkflowsDataTable");
  const workflows = json.workflows.flatMap((workflowJson) =>
    WorkflowStub.fromJson(workflowJson).toMaybe().toList(),
  );

  const columns: ColumnDef<WorkflowStub, any>[] = [
    columnHelper.accessor("label", {
      cell: (context) => (
        <Link
          href={hrefs.workflow({
            identifier: context.row.original.identifier,
          })}
        >
          {displayLabel({ locale, model: context.row.original })}
        </Link>
      ),
      header: () => translations("Label"),
    }),
  ];

  const data = useMemo(
    () =>
      workflows.toSorted((left, right) =>
        left.label
          .orDefault(Identifier.toString(left.identifier))
          .localeCompare(
            right.label.orDefault(Identifier.toString(left.identifier)),
          ),
      ),
    [workflows],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      initialState={{
        columnVisibility: {
          identifier: false,
        },
        sorting: [{ desc: false, id: "displayLabel" }],
      }}
      pagination={{ pageIndex: 0, pageSize: 10 }}
    />
  );
}
