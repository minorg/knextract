"use client";

import { DataTable as DelegateDataTable } from "@/lib/components/DataTable";
import { Link } from "@/lib/components/Link";
import { useHrefs } from "@/lib/hooks";
import { Claim, DocumentClaims, Identifier, Value } from "@/lib/models";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { CircleCheck, CircleSlash, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactElement, useMemo } from "react";

interface Row {
  gold: boolean;
  icon: ReactElement;
  identifier: Identifier;
  object: Value;
  predicate: Identifier;
}

export function DocumentClaimsDataTable(json: {
  documentClaims: ReturnType<DocumentClaims["toJson"]>;
  excludeHeader?: boolean;
}) {
  const hrefs = useHrefs();
  const translations = useTranslations("DocumentClaimsDataTable");

  const columns: ColumnDef<Row, any>[] = useMemo(() => {
    const columnHelper = createColumnHelper<Row>();

    return [
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
      columnHelper.accessor("predicate", {
        cell: (context) => Identifier.toString(context.row.original.predicate),
        header: () => translations("Predicate"),
        sortingFn: (left, right) =>
          Identifier.toString(left.original.predicate).localeCompare(
            Identifier.toString(right.original.predicate),
          ),
      }),
      columnHelper.accessor("identifier", {
        cell: (context) => {
          return (
            <Link
              data-testid={`claim-link-${context.row.original.identifier}`}
              href={hrefs.claim({
                identifier: context.row.original.identifier,
              })}
            >
              {context.row.original.icon}
            </Link>
          );
        },
        enableColumnFilter: false,
        header: () => "",
      }),
    ];
  }, [hrefs, translations]);

  const data: Row[] = useMemo(
    () =>
      DocumentClaims.fromJson(json.documentClaims)
        .map((documentClaims) => {
          const claimToRow = ({
            claim,
            icon,
          }: { claim: Claim; icon: ReactElement }): Row => ({
            gold: claim.gold,
            identifier: claim.identifier,
            object: claim.object,
            predicate: claim.predicate,
            icon,
          });

          if (documentClaims.type === "UnevaluatedClaims") {
            const icon = <Info className="h-4 w-4" />;
            return documentClaims.claims.map((claim) =>
              claimToRow({ claim, icon }),
            );
          }

          return documentClaims.truePositiveClaims
            .flatMap((truePositiveClaim) => [
              claimToRow({
                claim: truePositiveClaim.goldClaim,
                icon: <CircleCheck className="stroke-green-500 h-4 w-4" />,
              }),
              claimToRow({
                claim: truePositiveClaim.inferredClaim,
                icon: <CircleCheck className="stroke-green-500 h-4 w-4" />,
              }),
            ])
            .concat(
              documentClaims.falseNegativeClaims.map((claim) =>
                claimToRow({
                  claim,
                  icon: <CircleSlash className="stroke-red-500 h-4 w-4" />,
                }),
              ),
            )
            .concat(
              documentClaims.falsePositiveClaims.map((claim) =>
                claimToRow({
                  claim,
                  icon: (
                    <CircleSlash className="stroke-amber-500-500 h-4 w-4" />
                  ),
                }),
              ),
            );
        })
        .orDefault([]),
    [json],
  );

  return (
    <DelegateDataTable
      columns={columns}
      data={data}
      excludeHeader={json.excludeHeader}
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
