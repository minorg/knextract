import { ConfusionMatrix } from "@/lib/models/ConfusionMatrix";

export interface InformationRetrievalMetrics extends ConfusionMatrix {
  readonly f1Score: number;
  readonly negativeCount: number;
  readonly positiveCount: number;
}

export namespace InformationRetrievalMetrics {
  export function fromConfusionMatrix({
    falseNegativeCount,
    falsePositiveCount,
    truePositiveCount,
  }: ConfusionMatrix): InformationRetrievalMetrics {
    return {
      f1Score:
        truePositiveCount > 0 ||
        falsePositiveCount > 0 ||
        falseNegativeCount > 0
          ? (2 * truePositiveCount) /
            (2 * truePositiveCount + falsePositiveCount + falseNegativeCount)
          : 0,
      falseNegativeCount,
      falsePositiveCount,
      negativeCount: falseNegativeCount,
      positiveCount: falsePositiveCount + truePositiveCount,
      truePositiveCount,
    };
  }
}
