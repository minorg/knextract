import { Term } from "@rdfjs/types";
import { expect } from "vitest";

export function expectTermsEqual(expectedTerm: Term, actualTerm: Term): void {
  expect(expectedTerm.termType).toStrictEqual(actualTerm.termType);
  expect(expectedTerm.value).toStrictEqual(actualTerm.value);
}
