"use client";

import { useHrefs } from "@/lib/hooks";
import { CorpusStub, Identifier, displayLabel } from "@/lib/models";
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

export function CorporaDataTable(json: {
  corpora: readonly ReturnType<CorpusStub["toJson"]>[];
}) {
  const hrefs = useHrefs();
  const locale = useLocale();
  const translations = useTranslations("CorporaDataTable");

  const columns: ColumnDef<Row, any>[] = [
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
      json.corpora
        .flatMap((json) => CorpusStub.fromJson(json).toMaybe().toList())
        .map(
          (corpus) =>
            ({
              displayLabel: displayLabel(corpus, { locale }),
              identifier: corpus.identifier,
            }) satisfies Row,
        )
        .toSorted((left, right) =>
          left.displayLabel.localeCompare(right.displayLabel),
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
