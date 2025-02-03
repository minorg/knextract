import { logger } from "@/lib/logger";
import {
  Claim,
  ClaimEvaluation,
  Identifier,
  InformationRetrievalMetrics,
  Value,
} from "@/lib/models";
import { Maybe } from "purify-ts";

function claimEquals(left: Claim, right: Claim): boolean {
  return (
    left.subject.equals(right.subject) &&
    left.predicate.equals(right.predicate) &&
    Value.equals(left.object, right.object).extract() === true
  );
}

export function evaluateClaims(
  claims: readonly Claim[],
): Maybe<ClaimEvaluation> {
  const claimIdentifiers = new Set<string>();
  const uniqueGoldClaims: Claim[] = [];
  const uniqueInferredClaims: Claim[] = [];
  for (const claim of claims) {
    if (claimIdentifiers.has(Identifier.toString(claim.identifier))) {
      logger.debug(
        "duplicate claim identifier: %s",
        Identifier.toString(claim.identifier),
      );
      continue;
    }
    claimIdentifiers.add(Identifier.toString(claim.identifier));

    if (claim.gold) {
      if (
        uniqueGoldClaims.some((uniqueGoldClaim) =>
          claimEquals(claim, uniqueGoldClaim),
        )
      ) {
        logger.debug(
          "duplicate gold claim on subject %s",
          Identifier.toString(claim.subject),
        );
        continue;
      }

      uniqueGoldClaims.push(claim);
    } else {
      if (
        uniqueInferredClaims.some((uniqueInferredClaim) =>
          claimEquals(claim, uniqueInferredClaim),
        )
      ) {
        continue;
      }

      uniqueInferredClaims.push(claim);
    }
  }

  if (uniqueGoldClaims.length === 0) {
    return Maybe.empty();
  }

  let falseNegativeCount = 0;
  const truePositives: ClaimEvaluation["truePositives"] = [];

  uniqueGoldClaims.forEach((goldClaim) => {
    for (const inferredClaim of uniqueInferredClaims) {
      if (claimEquals(goldClaim, inferredClaim)) {
        // Gold matched inferred -> true positive
        truePositives.push({
          goldClaim: goldClaim.toJson(),
          inferredClaim: inferredClaim.toJson(),
        });
        return;
      }
    }
    // Gold did not match any inferred -> false negative
    falseNegativeCount++;
  });
  // Inferred did not correspond to any gold -> false positive
  const falsePositiveCount =
    uniqueInferredClaims.length -
    new Set(
      truePositives.map((truePositive) => truePositive.inferredClaim["@id"]),
    ).size;

  return Maybe.of({
    ...InformationRetrievalMetrics.fromConfusionMatrix({
      falseNegativeCount,
      falsePositiveCount,
      truePositiveCount: truePositives.length,
    }),
    truePositives,
  });
}
