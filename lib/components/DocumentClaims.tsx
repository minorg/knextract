"use client";

import { AnnotateDocumentForm } from "@/lib/components/AnnotateDocumentForm";
import { DocumentClaimsDataTable } from "@/lib/components/DocumentClaimsDataTable";
import {
  Claim,
  ClaimsEvaluation,
  Document,
  DocumentStub,
  WorkflowStub,
} from "@/lib/models";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

export function DocumentClaims(json: {
  claims: readonly ReturnType<Claim["toJson"]>[];
  claimsEvaluation: ClaimsEvaluation | null;
  document: ReturnType<DocumentStub["toJson"]>;
  workflows: ReturnType<WorkflowStub["toJson"]>[];
}) {
  const [claimsState, setClaimsState] = useState<{
    claims: readonly ReturnType<Claim["toJson"]>[];
    claimsEvaluation: ClaimsEvaluation | null;
  } | null>(null);
  const translations = useTranslations("DocumentClaims");

  useEffect(() => {
    setClaimsState({
      claims: json.claims,
      claimsEvaluation: json.claimsEvaluation,
    });
  }, [json]);

  if (claimsState === null) {
    return null;
  }

  const { claims, claimsEvaluation } = claimsState;

  const annotateDocumentForm = (
    <AnnotateDocumentForm
      document={json.document}
      onAnnotateDocument={setClaimsState}
      workflows={json.workflows}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      {json.workflows.length > 0 ? (
        claimsEvaluation !== null ? (
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row gap-2">
              <div>
                <b>{translations("F1 score")}</b>:{" "}
                {Math.round(claimsEvaluation.f1Score * 100.0) / 100.0}
              </div>
              <div>&middot;</div>
              <div>
                <i>{translations("True positives")}</i>:{" "}
                {Math.round(claimsEvaluation.truePositiveCount)}
              </div>
              <div>&middot;</div>
              <div>
                <i>{translations("False positives")}</i>:{" "}
                {Math.round(claimsEvaluation.falsePositiveCount)}
              </div>
              <div>&middot;</div>
              <div>
                <i>{translations("False negatives")}</i>:{" "}
                {Math.round(claimsEvaluation.falseNegativeCount)}
              </div>
            </div>
            {annotateDocumentForm}
          </div>
        ) : (
          <div className="flex flex-row justify-end">
            {annotateDocumentForm}
          </div>
        )
      ) : null}
      <DocumentClaimsDataTable
        claims={claims !== null ? claims : json.claims}
        claimsEvaluation={claimsEvaluation}
      />
    </div>
  );
}
