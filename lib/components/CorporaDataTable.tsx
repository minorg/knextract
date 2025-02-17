"use client";

import { useHrefs } from "@/lib/hooks";
import { Corpus, CorpusStub, displayLabel } from "@/lib/models";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { DataTable } from "./DataTable";
import { Link } from "./Link";

const columnHelper = createColumnHelper<CorpusStub>();

export function CorporaDataTable(json: {
  corpora: readonly ReturnType<CorpusStub["toJson"]>[];
}) {
  const hrefs = useHrefs();
  const locale = useLocale();
  const translations = useTranslations("CorporaDataTable");

  const columns: ColumnDef<CorpusStub, any>[] = [
    columnHelper.accessor("identifier", {
      cell: (context) => (
        <Link
          href={hrefs.corpus({
            identifier: context.row.original.identifier,
          })}
        >
          {displayLabel(context.row.original, { locale })}
        </Link>
      ),
      header: () => translations("Label"),
    }),
  ];

  const data = useMemo(
    () =>
      json.corpora
        .flatMap((json) => CorpusStub.fromJson(json).toMaybe().toList())
        .toSorted((left, right) =>
          displayLabel(left, { locale }).localeCompare(
            displayLabel(right, { locale }),
          ),
        ),
    [json, locale],
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
