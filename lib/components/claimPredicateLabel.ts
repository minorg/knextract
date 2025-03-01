import { Claim, ClaimProperty, Identifier, Locale } from "@/lib/models";

export function claimPredicateLabel({
  claim,
  claimProperties,
  locale,
}: {
  claim: Claim;
  claimProperties: readonly ClaimProperty[];
  locale: Locale;
}): string {
  for (const claimProperty of claimProperties) {
    if (claimProperty.identifier.equals(claim.predicate)) {
      for (const label of claimProperty.labels) {
        if (label.language === locale) {
          return label.value;
        }
      }
      for (const label of claimProperty.labels) {
        if (label.language === "") {
          return label.value;
        }
      }
    }
  }
  return Identifier.toString(claim.predicate);
}
