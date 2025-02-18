"use client";

import { DataTable as DelegateDataTable } from "@/lib/components/DataTable";
import { Link } from "@/lib/components/Link";
import { useHrefs } from "@/lib/hooks";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { CircleCheck, CircleSlash, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment, ReactNode, useMemo } from "react";

export function DocumentAnnotationsDataTable({
  annotations,
  annotationsEvaluation,
  excludeHeader,
}: {
  annotations: readonly json.Annotation[];
  annotationsEvaluation: json.AnnotationsEvaluation | null;
  excludeHeader?: boolean;
}) {
  interface Row extends json.Annotation {
    readonly conceptPathString: string;
    readonly conceptScheme: json.ConceptScheme | null;
  }

  const hrefs = useHrefs();
  const translations = useTranslations("DocumentAnnotationsDataTable");

  const columns: ColumnDef<Row, any>[] = useMemo(() => {
    const columnHelper = createColumnHelper<Row>();

    return [
      columnHelper.accessor("conceptScheme", {
        cell: (context) =>
          context.row.original.conceptScheme ? (
            <Link
              href={hrefs.conceptScheme({
                identifier: context.row.original.conceptScheme.identifier,
              })}
            >
              {context.row.original.conceptScheme.displayLabel}
            </Link>
          ) : null,
        header: () => translations("Concept scheme"),
        id: "conceptScheme",
        sortingFn: (left, right) => {
          if (left.original.conceptScheme !== null) {
            if (right.original.conceptScheme !== null) {
              return left.original.conceptScheme.displayLabel.localeCompare(
                right.original.conceptScheme.displayLabel,
              );
            }
            return 1; // left > null
          }
          if (right.original.conceptScheme !== null) {
            return -1; // right > null
          }
          return 0; // null === null
        },
      }),
      columnHelper.accessor("conceptPathString", {
        cell: (context) => (
          <>
            {context.row.original.conceptPath.map<ReactNode>(
              (concept, conceptI) => (
                <Fragment key={conceptI}>
                  {conceptI > 0 ? <span>&nbsp;&gt;&nbsp;</span> : null}
                  <Link
                    href={hrefs.concept({
                      identifier: concept.identifier,
                    })}
                    key={conceptI}
                  >
                    {concept.displayLabel}
                  </Link>
                </Fragment>
              ),
            )}
          </>
        ),
        header: () => translations("Concept"),
        id: "conceptPathString",
      }),
      columnHelper.accessor("gold", {
        cell: (context) =>
          context.row.original.gold
            ? translations("Gold")
            : translations("Inferred"),
        enableColumnFilter: false,
        enableSorting: true,
        header: () => translations("Type"),
        sortingFn: (rowA, rowB) =>
          (rowA.original.gold ? 1 : 0) - (rowB.original.gold ? 1 : 0),
      }),
      columnHelper.accessor("identifier", {
        cell: (context) => {
          let icon: React.ReactElement;
          if (annotationsEvaluation) {
            if (
              annotationsEvaluation.truePositives.some((truePositive) => {
                if (context.row.original.gold) {
                  return (
                    truePositive.goldAnnotationIdentifier ===
                    context.row.original.identifier
                  );
                }
                return (
                  truePositive.inferredAnnotationIdentifier ===
                  context.row.original.identifier
                );
              })
            ) {
              icon = <CircleCheck className="stroke-green-500 h-4 w-4" />;
            } else {
              icon = <CircleSlash className="stroke-red-500 h-4 w-4" />;
            }
          } else {
            icon = <Info className="h-4 w-4" />;
          }

          return (
            <Link
              data-testid={`annotation-link-${context.row.original.identifier}`}
              href={hrefs.annotation({
                identifier: context.row.original.identifier,
              })}
            >
              {icon}
            </Link>
          );
        },
        enableColumnFilter: false,
        header: () => "",
      }),
    ];
  }, [annotationsEvaluation, hrefs, translations]);

  const data: Row[] = useMemo(
    () =>
      annotations
        .map((annotation) => {
          const conceptSchemesByIdentifier: Record<string, json.ConceptScheme> =
            {};
          for (const concept of annotation.conceptPath) {
            for (const conceptScheme of concept.conceptSchemes) {
              conceptSchemesByIdentifier[conceptScheme.identifier] =
                conceptScheme;
            }
          }
          const conceptSchemes = Object.values(conceptSchemesByIdentifier);
          return {
            ...annotation,
            conceptPathString: annotation.conceptPath
              .map((concept) => concept.displayLabel)
              .join(" > "),
            conceptScheme:
              conceptSchemes.length === 1 ? conceptSchemes[0] : null,
          } satisfies Row;
        })
        .sort((left, right) =>
          left.conceptPathString.localeCompare(right.conceptPathString),
        ),
    [annotations],
  );

  return (
    <DelegateDataTable
      columns={columns}
      data={data}
      excludeHeader={excludeHeader}
      initialState={{
        sorting: [{ desc: false, id: "conceptPathString" }],
      }}
      pagination={{
        pageIndex: 0,
        pageSize: 10,
      }}
    />
  );
}
