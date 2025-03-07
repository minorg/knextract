"use client";

import { getCorpusDocuments } from "@/lib/actions/getCorpusDocuments";
import { LoadingSpinner } from "@/lib/components/ui/loading-spinner";
import { useHrefs } from "@/lib/hooks";
import { DocumentStub, Identifier, Locale, displayLabel } from "@/lib/models";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { parseAsInteger, useQueryStates } from "nuqs";
import React from "react";
import { DataTable } from "./DataTable";
import { Link } from "./Link";

interface Row {
  readonly displayLabel: string;
  readonly identifier: Identifier;
}

const columnHelper = createColumnHelper<Row>();

export function CorpusDocumentsDataTable({
  corpusIdentifier,
  documentsCount,
}: {
  corpusIdentifier: string;
  documentsCount: number;
}) {
  const hrefs = useHrefs();
  const locale = useLocale() as Locale;
  const [pagination, setPagination] = useQueryStates({
    pageIndex: parseAsInteger.withDefault(0),
    pageSize: parseAsInteger.withDefault(10),
  });
  const translations = useTranslations("CorpusDocumentsDataTable");

  const { data } = useQuery({
    queryKey: [
      corpusIdentifier,
      locale,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: () =>
      getCorpusDocuments({
        corpusIdentifier,
        locale,
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
      }),
  });

  if (!data) {
    return (
      <div className="flex flex-row items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const columns: ColumnDef<Row, any>[] = [
    columnHelper.accessor("displayLabel", {
      cell: (context) => (
        <Link
          href={hrefs.document({
            identifier: context.row.original.identifier,
          })}
        >
          {context.row.original.displayLabel}
        </Link>
      ),
      enableColumnFilter: false,
      enableSorting: false,
      header: () => translations("Label"),
    }),
  ];

  return (
    <DataTable
      columns={columns}
      data={data!.documents
        .flatMap((json) => DocumentStub.fromJson(json).toMaybe().toList())
        .map((document) => ({
          displayLabel: displayLabel(document, { locale }),
          identifier: document.identifier,
        }))}
      enableRowSelection
      initialState={{
        columnVisibility: {
          identifier: false,
        },
        // sorting: [{ desc: false, id: "displayLabel" }],
      }}
      manualPagination
      pagination={pagination}
      rowCount={documentsCount}
      setPagination={setPagination}
    />
  );
}
