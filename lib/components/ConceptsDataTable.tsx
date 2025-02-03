"use client";

import { useHrefs } from "@/lib/hooks";
import { json } from "@/lib/models/impl";
import {
  ColumnDef,
  OnChangeFn,
  PaginationState,
  createColumnHelper,
} from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { DataTable } from "./DataTable";
import { Link } from "./Link";

const columnHelper = createColumnHelper<json.Concept>();

export function ConceptsDataTable({
  concepts,
  pagination,
  setPagination,
}: {
  concepts: json.Concept[];
  pagination: PaginationState;
  setPagination?: OnChangeFn<PaginationState>;
}) {
  const hrefs = useHrefs();
  const translations = useTranslations("ConceptsDataTable");

  const columns: ColumnDef<json.Concept, any>[] = [
    columnHelper.accessor("identifier", {}),
    columnHelper.accessor("displayLabel", {
      cell: (context) => (
        <Link
          href={hrefs.concept({
            identifier: context.row.original.identifier,
          })}
        >
          {context.row.original.displayLabel}
        </Link>
      ),
      enableSorting: true,
      // filterFn: "includesString",
      header: () => translations("Concept"),
      sortingFn: "alphanumericCaseSensitive",
    }),
  ];

  return (
    <DataTable
      columns={columns}
      data={concepts}
      initialState={{
        columnVisibility: {
          identifier: false,
        },
      }}
      pagination={pagination}
      setPagination={setPagination}
    />
  );
}
