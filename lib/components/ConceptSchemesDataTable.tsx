"use client";

import { useHrefs } from "@/lib/hooks";
import { json } from "@/lib/models/impl";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { DataTable } from "./DataTable";
import { Link } from "./Link";

const columnHelper = createColumnHelper<json.ConceptScheme>();

export function ConceptSchemesDataTable({
  conceptSchemes,
}: {
  conceptSchemes: json.ConceptScheme[];
}) {
  const hrefs = useHrefs();
  const translations = useTranslations("ConceptSchemesDataTable");

  const columns: ColumnDef<json.ConceptScheme, any>[] = [
    columnHelper.accessor("identifier", {}),
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

  return (
    <DataTable
      columns={columns}
      data={conceptSchemes}
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
