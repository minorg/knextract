"use client";

import { useHrefs } from "@/lib/hooks";
import { json } from "@/lib/models/impl";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { DataTable } from "./DataTable";
import { Link } from "./Link";

const columnHelper = createColumnHelper<json.Corpus>();

export function CorporaDataTable({
  corpora,
}: {
  corpora: json.Corpus[];
}) {
  const hrefs = useHrefs();
  const translations = useTranslations("CorporaDataTable");

  const columns: ColumnDef<json.Corpus, any>[] = [
    columnHelper.accessor("displayLabel", {
      cell: (context) => (
        <Link
          href={hrefs.corpus({
            identifier: context.row.original.identifier,
          })}
        >
          {context.row.original.displayLabel}
        </Link>
      ),
      header: () => translations("Label"),
    }),
  ];

  const data = useMemo(
    () =>
      corpora.toSorted((left, right) =>
        left.displayLabel.localeCompare(right.displayLabel),
      ),
    [corpora],
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
