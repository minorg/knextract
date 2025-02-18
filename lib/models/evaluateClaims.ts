import { logger } from "@/lib/logger";
import {
  Claim,
  EvaluatedClaims,
  Identifier,
  TruePositiveClaimPair,
  Value,
} from "@/lib/models";
import TermSet from "@rdfjs/term-set";
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
): Maybe<EvaluatedClaims> {
  const claimIdentifiers = new TermSet<Identifier>();
  const uniqueGoldClaims: Claim[] = [];
  const uniqueInferredClaims: Claim[] = [];
  for (const claim of claims) {
    if (claimIdentifiers.has(claim.identifier)) {
      logger.debug(
        "duplicate claim identifier: %s",
        Identifier.toString(claim.identifier),
      );
      continue;
    }
    claimIdentifiers.add(claim.identifier);

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

  const falseNegativeClaims: Claim[] = [];
  const falsePositiveClaims: Claim[] = [];
  const truePositiveClaims: TruePositiveClaimPair[] = [];

  uniqueGoldClaims.forEach((goldClaim) => {
    for (const inferredClaim of uniqueInferredClaims) {
      if (claimEquals(goldClaim, inferredClaim)) {
        // Gold matched inferred -> true positive
        truePositiveClaims.push(
          new TruePositiveClaimPair({
            goldClaim,
            inferredClaim,
          }),
        );
        return;
      }
    }
    // Gold did not match any inferred -> false negative
    falseNegativeClaims.push(goldClaim);
  });

  // Inferred did not correspond to any gold -> false positive
  for (const inferredClaim of uniqueInferredClaims) {
    if (
      !truePositiveClaims.some((truePositiveClaimPair) =>
        truePositiveClaimPair.inferredClaim.identifier.equals(
          inferredClaim.identifier,
        ),
      )
    ) {
      falsePositiveClaims.push(inferredClaim);
    }
  }

  return Maybe.of(
    new EvaluatedClaims({
      falseNegativeClaims,
      falsePositiveClaims,
      truePositiveClaims,
    }),
  );
}
