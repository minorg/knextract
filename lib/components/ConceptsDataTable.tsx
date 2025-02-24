"use client";

import { useHrefs } from "@/lib/hooks";
import { ConceptStub, displayLabel } from "@/lib/models";
import {
  ColumnDef,
  OnChangeFn,
  PaginationState,
  createColumnHelper,
} from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { DataTable } from "./DataTable";
import { Link } from "./Link";

const columnHelper = createColumnHelper<ConceptStub>();

export function ConceptsDataTable({
  concepts,
  pagination,
  setPagination,
}: {
  concepts: readonly ReturnType<typeof ConceptStub.toJson>[];
  pagination: PaginationState;
  setPagination?: OnChangeFn<PaginationState>;
}) {
  const hrefs = useHrefs();
  const locale = useLocale();
  const translations = useTranslations("ConceptsDataTable");

  const columns: ColumnDef<ConceptStub, any>[] = [
    columnHelper.accessor("identifier", {
      cell: (context) => (
        <Link
          href={hrefs.concept({
            identifier: context.row.original.identifier,
          })}
        >
          {displayLabel(context.row.original, { locale })}
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
      data={concepts.flatMap((json) =>
        ConceptStub.fromJson(json).toMaybe().toList(),
      )}
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
