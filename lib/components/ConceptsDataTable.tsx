"use client";

import { useHrefs } from "@/lib/hooks";
import { ConceptStub, Identifier, displayLabel } from "@/lib/models";
import {
  ColumnDef,
  OnChangeFn,
  PaginationState,
  createColumnHelper,
} from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { DataTable } from "./DataTable";
import { Link } from "./Link";

interface Row {
  readonly displayLabel: string;
  readonly identifier: Identifier;
}

const columnHelper = createColumnHelper<Row>();

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

  const columns: ColumnDef<Row, any>[] = [
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

  const data = useMemo(
    () =>
      concepts
        .flatMap((json) => ConceptStub.fromJson(json).toMaybe().toList())
        .map((concept) => ({
          identifier: concept.identifier,
          displayLabel: displayLabel(concept, { locale }),
        })),
    [concepts, locale],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
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
