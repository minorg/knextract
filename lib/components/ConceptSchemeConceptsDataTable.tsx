"use client";

import { getConceptSchemeConcepts } from "@/lib/actions/getConceptSchemeConcepts";
import { DataTable } from "@/lib/components/DataTable";
import { Link } from "@/lib/components/Link";
import { LoadingSpinner } from "@/lib/components/ui/loading-spinner";
import { useHrefs } from "@/lib/hooks";
import { Concept, Locale, kosLabels } from "@/lib/models";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { parseAsInteger, useQueryStates } from "nuqs";
import React from "react";

const columnHelper = createColumnHelper<Concept>();

export function ConceptSchemeConceptsDataTable({
  conceptSchemeIdentifier,
  conceptsCount,
}: {
  conceptSchemeIdentifier: string;
  conceptsCount: number;
}) {
  const locale = useLocale() as Locale;
  const [pagination, setPagination] = useQueryStates({
    pageIndex: parseAsInteger.withDefault(0),
    pageSize: parseAsInteger.withDefault(10),
  });

  const { data } = useQuery({
    queryKey: [
      conceptSchemeIdentifier,
      locale,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: () =>
      getConceptSchemeConcepts({
        conceptSchemeIdentifier,
        locale,
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
      }),
  });

  const hrefs = useHrefs();
  const translations = useTranslations("ConceptSchemeConceptsDataTable");

  if (!data) {
    return (
      <div className="flex flex-row items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const columns: ColumnDef<Concept, any>[] = [
    columnHelper.accessor("identifier", {
      cell: (context) => (
        <Link
          href={hrefs.concept({
            identifier: context.row.original.identifier,
          })}
        >
          {kosLabels(context.row.original).display}
        </Link>
      ),
      enableColumnFilter: false,
      enableSorting: false,
      // filterFn: "includesString",
      header: () => translations("Concept"),
      // sortingFn: "alphanumericCaseSensitive",
    }),
  ];

  return (
    <DataTable
      columns={columns}
      data={data.concepts}
      manualPagination
      pagination={pagination}
      rowCount={conceptsCount}
      setPagination={setPagination}
    />
  );
}
