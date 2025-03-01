"use client";

import { useHrefs } from "@/lib/hooks";
import { ConceptSchemeStub, displayLabel } from "@/lib/models";
import { Identifier } from "@kos-kit/models";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { DataTable } from "./DataTable";
import { Link } from "./Link";

interface Row {
  readonly displayLabel: string;
  readonly identifier: Identifier;
}

const columnHelper = createColumnHelper<Row>();

export function ConceptSchemesDataTable(json: {
  conceptSchemes: readonly ReturnType<typeof ConceptSchemeStub.toJson>[];
}) {
  const hrefs = useHrefs();
  const locale = useLocale();
  const translations = useTranslations("ConceptSchemesDataTable");

  const columns: ColumnDef<Row, any>[] = [
    columnHelper.accessor("displayLabel", {
      cell: (context) => (
        <Link
          href={hrefs.conceptScheme({
            identifier: context.row.original.identifier,
          })}
        >
          {context.row.original.displayLabel}
        </Link>
      ),
      enableSorting: true,
      // filterFn: "includesString",
      header: () => translations("Concept scheme"),
      sortingFn: "alphanumericCaseSensitive",
    }),
  ];

  const data = useMemo(
    () =>
      json.conceptSchemes
        .flatMap((json) => ConceptSchemeStub.fromJson(json).toMaybe().toList())
        .map((conceptScheme) => ({
          identifier: conceptScheme.identifier,
          displayLabel: displayLabel(conceptScheme, { locale }),
        })),
    [json, locale],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      excludeHeader={true}
      initialState={{
        columnVisibility: {
          identifier: false,
        },
      }}
      pagination={{ pageIndex: 0, pageSize: 10 }}
    />
  );
}
