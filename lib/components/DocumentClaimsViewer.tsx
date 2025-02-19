"use client";

import { AnnotateDocumentForm } from "@/lib/components/AnnotateDocumentForm";
import { DocumentClaimsDataTable } from "@/lib/components/DocumentClaimsDataTable";
import {
  DocumentClaims,
  DocumentStub,
  UnevaluatedClaims,
  WorkflowStub,
} from "@/lib/models";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

export function DocumentClaimsViewer(json: {
  document: ReturnType<DocumentStub["toJson"]>;
  documentClaims: ReturnType<DocumentClaims["toJson"]>;
  workflows: ReturnType<WorkflowStub["toJson"]>[];
}) {
  const [documentClaims, setDocumentClaims] = useState<DocumentClaims | null>(
    null,
  );
  const translations = useTranslations("DocumentClaimsViewer");

  useEffect(() => {
    setDocumentClaims(
      DocumentClaims.fromJson(json.documentClaims).orDefault(
        new UnevaluatedClaims({ claims: [] }),
      ),
    );
  }, [json]);

  if (documentClaims === null) {
    return null;
  }

  const annotateDocumentForm = (
    <AnnotateDocumentForm
      document={json.document}
      documentClaims={documentClaims.toJson()}
      onAnnotateDocument={setDocumentClaims}
      workflows={json.workflows}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      {json.workflows.length > 0 ? (
        documentClaims.type === "EvaluatedClaims" ? (
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row gap-2">
              <div>
                <b>{translations("F1 score")}</b>:{" "}
                {Math.round(
                  ((2 * documentClaims.truePositiveClaims.length) /
                    (2 * documentClaims.truePositiveClaims.length +
                      documentClaims.falsePositiveClaims.length +
                      documentClaims.falseNegativeClaims.length)) *
                    100.0,
                ) / 100.0}
              </div>
              <div>&middot;</div>
              <div>
                <i>{translations("True positives")}</i>:{" "}
                {Math.round(documentClaims.truePositiveClaims.length)}
              </div>
              <div>&middot;</div>
              <div>
                <i>{translations("False positives")}</i>:{" "}
                {Math.round(documentClaims.falsePositiveClaims.length)}
              </div>
              <div>&middot;</div>
              <div>
                <i>{translations("False negatives")}</i>:{" "}
                {Math.round(documentClaims.falseNegativeClaims.length)}
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
      <DocumentClaimsDataTable documentClaims={documentClaims.toJson()} />
    </div>
  );
}
