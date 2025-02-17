"use client";

import { useHrefs } from "@/lib/hooks";
import { ConceptSchemeStub, kosLabels } from "@/lib/models";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { DataTable } from "./DataTable";
import { Link } from "./Link";

const columnHelper = createColumnHelper<ConceptSchemeStub>();

export function ConceptSchemesDataTable(json: {
  conceptSchemes: ReturnType<typeof ConceptSchemeStub.toJson>[];
}) {
  const hrefs = useHrefs();
  const translations = useTranslations("ConceptSchemesDataTable");

  const columns: ColumnDef<ConceptSchemeStub, any>[] = [
    columnHelper.accessor("identifier", {
      cell: (context) => (
        <Link
          href={hrefs.conceptScheme({
            identifier: context.row.original.identifier,
          })}
        >
          {kosLabels(context.row.original).display}
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
      data={json.conceptSchemes.flatMap((json) =>
        ConceptSchemeStub.fromJson(json).toMaybe().toList(),
      )}
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
