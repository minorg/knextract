"use client";

import { AnnotateDocumentForm } from "@/lib/components/AnnotateDocumentForm";
import { DocumentAnnotationsDataTable } from "@/lib/components/DocumentAnnotationsDataTable";
import { json } from "@/lib/models/impl";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

export function DocumentAnnotations({
  annotations: annotationsProp,
  annotationsEvaluation: annotationsEvaluationProp,
  document,
  workflows,
}: {
  annotations: readonly json.Annotation[];
  annotationsEvaluation: json.AnnotationsEvaluation | null;
  document: json.Document;
  workflows: readonly json.Workflow[];
}) {
  const [annotationsState, setAnnotationsState] = useState<{
    annotations: readonly json.Annotation[];
    annotationsEvaluation: json.AnnotationsEvaluation | null;
  } | null>(null);
  const translations = useTranslations("DocumentAnnotations");

  useEffect(() => {
    setAnnotationsState({
      annotations: annotationsProp,
      annotationsEvaluation: annotationsEvaluationProp,
    });
  }, [annotationsProp, annotationsEvaluationProp]);

  if (annotationsState === null) {
    return null;
  }

  const { annotations, annotationsEvaluation } = annotationsState;

  const annotateDocumentForm = (
    <AnnotateDocumentForm
      document={document}
      onAnnotateDocument={setAnnotationsState}
      workflows={workflows}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      {workflows.length > 0 ? (
        annotationsEvaluation !== null ? (
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row gap-2">
              <div>
                <b>{translations("F1 score")}</b>:{" "}
                {Math.round(annotationsEvaluation.f1Score * 100.0) / 100.0}
              </div>
              <div>&middot;</div>
              <div>
                <i>{translations("True positives")}</i>:{" "}
                {Math.round(annotationsEvaluation.truePositiveCount)}
              </div>
              <div>&middot;</div>
              <div>
                <i>{translations("False positives")}</i>:{" "}
                {Math.round(annotationsEvaluation.falsePositiveCount)}
              </div>
              <div>&middot;</div>
              <div>
                <i>{translations("False negatives")}</i>:{" "}
                {Math.round(annotationsEvaluation.falseNegativeCount)}
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
      <DocumentAnnotationsDataTable
        annotations={annotations !== null ? annotations : annotationsProp}
        annotationsEvaluation={annotationsEvaluation}
      />
    </div>
  );
}
